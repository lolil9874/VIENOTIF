// Edge Function Worker - Appelle l'API route Next.js pour exécuter le worker
// Cette fonction est appelée par pg_cron via pg_net

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Vérifier que c'est une requête POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Récupérer les variables d'environnement Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Worker] Missing environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Configuration error",
          details: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Créer le client Supabase avec service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[Worker Edge Function] Starting worker...");

    // Créer un job run
    let jobRunId: string | null = null;
    try {
      const { data: jobRun, error: createError } = await supabase
        .from("job_runs")
        .insert({
          status: "running",
          processed: 0,
          new_offers: 0,
          errors: 0,
          log: [],
        })
        .select()
        .single();

      if (!createError && jobRun) {
        jobRunId = jobRun.id;
        console.log(`[Worker] Job run created: ${jobRunId}`);
      }
    } catch (err) {
      console.warn("[Worker] Could not create job run, continuing...", err);
    }

    const logs: string[] = [];
    let processed = 0;
    let newOffers = 0;
    let errors = 0;

    try {
      // Récupérer toutes les abonnements actifs
      const { data: subscriptions, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("is_active", true);

      if (fetchError) {
        throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
      }

      logs.push(`Found ${subscriptions?.length || 0} active subscriptions`);

      if (!subscriptions || subscriptions.length === 0) {
        logs.push("No active subscriptions to process");
      } else {
        // Traiter chaque abonnement
        for (const sub of subscriptions) {
          try {
            processed++;
            const filters = (sub.filters as any) || {};
            logs.push(`Processing subscription: ${sub.label}`);

            // Récupérer les offres depuis le cache
            let query = supabase
              .from("cached_offers")
              .select("raw_data")
              .order("updated_at", { ascending: false });

            // Appliquer les filtres SQL
            if (filters.countriesIds?.length > 0) {
              query = query.in("country_id", filters.countriesIds);
            }
            if (filters.missionsTypesIds?.length > 0) {
              const missionTypes = filters.missionsTypesIds.map((id: string) => 
                id === "1" ? "VIE" : id === "2" ? "VIA" : null
              ).filter(Boolean);
              if (missionTypes.length > 0) {
                query = query.in("mission_type", missionTypes);
              }
            }
            if (filters.missionsDurations?.length > 0) {
              query = query.in("mission_duration", filters.missionsDurations.map(Number));
            }
            if (filters.teletravail?.includes("1")) {
              query = query.eq("teleworking_available", true);
            }
            if (filters.geographicZones?.length > 0) {
              query = query.in("geographic_zone", filters.geographicZones);
            }

            const { data: cachedData, error: cacheError } = await query.limit(1000);

            if (cacheError) {
              throw new Error(`Failed to fetch cached offers: ${cacheError.message}`);
            }

            // Extraire les offres
            let offers = (cachedData || [])
              .map((row: any) => row.raw_data)
              .filter(Boolean);

            // Filtrer par ville (fuzzy)
            if (filters.citySearch || filters.cities?.length > 0) {
              const citySearch = filters.citySearch || (filters.cities || []).join("|");
              if (citySearch) {
                const cityNames = citySearch.split("|").map((c: string) => c.trim().toLowerCase());
                offers = offers.filter((offer: any) => {
                  const offerCity = (offer.cityName || offer.cityNameEn || "").toLowerCase();
                  return cityNames.some((name: string) => 
                    offerCity.includes(name) || name.includes(offerCity.split(",")[0].trim())
                  );
                });
              }
            }

            // Filtrer par entreprise (fuzzy)
            if (filters.companySearch || filters.companyName) {
              const companySearch = (filters.companySearch || filters.companyName || "").toLowerCase();
              offers = offers.filter((offer: any) => {
                const companyLower = (offer.organizationName || "").toLowerCase();
                return companyLower.includes(companySearch);
              });
            }

            // Filtrer par indemnité minimale
            if (filters.minIndemnite !== undefined && filters.minIndemnite !== null) {
              offers = offers.filter((offer: any) => offer.indemnite >= filters.minIndemnite);
            }

            // Filtrer par indemnité maximale
            if (filters.maxIndemnite !== undefined && filters.maxIndemnite !== null) {
              offers = offers.filter((offer: any) => offer.indemnite <= filters.maxIndemnite);
            }

            // Obtenir les IDs d'offres déjà vues
            const seenIds = new Set<number>(
              Array.isArray(sub.seen_offer_ids) ? sub.seen_offer_ids : []
            );

            // Trouver les nouvelles offres
            const newOffersList = offers.filter((offer: any) => !seenIds.has(offer.id));

            if (newOffersList.length > 0) {
              logs.push(`Found ${newOffersList.length} new offers for ${sub.label}`);

              // Récupérer les paramètres utilisateur
              const { data: userSettings } = await supabase
                .from("user_settings")
                .select("*")
                .eq("user_id", sub.user_id)
                .single();

              // Envoyer les notifications (limité à 10 par abonnement)
              for (const offer of newOffersList.slice(0, 10)) {
                try {
                  await sendNotification(supabase, sub.channel, sub.target, offer, sub.label, userSettings);
                  newOffers++;
                  logs.push(`Notification sent for offer: ${offer.missionTitle || offer.id}`);
                } catch (notifError) {
                  errors++;
                  logs.push(`Failed to send notification: ${notifError}`);
                }
              }

              // Mettre à jour les IDs vus
              const updatedSeenIds = [
                ...Array.from(seenIds),
                ...newOffersList.map((o: any) => o.id),
              ];

              await supabase
                .from("subscriptions")
                .update({ seen_offer_ids: updatedSeenIds })
                .eq("id", sub.id);
            } else {
              logs.push(`No new offers for ${sub.label}`);
            }
          } catch (subError: any) {
            errors++;
            logs.push(`Error processing ${sub.label}: ${subError.message || subError}`);
          }
        }
      }

      // Mettre à jour le job run comme succès
      if (jobRunId) {
        await supabase
          .from("job_runs")
          .update({
            status: "success",
            finished_at: new Date().toISOString(),
            processed,
            new_offers: newOffers,
            errors,
            log: logs,
          })
          .eq("id", jobRunId);
      }

      logs.push(`[${new Date().toISOString()}] Worker completed`);

      return new Response(
        JSON.stringify({
          success: true,
          processed,
          newOffers,
          errors,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      logs.push(`[${new Date().toISOString()}] Worker failed: ${error.message || error}`);

      // Mettre à jour le job run comme échec
      if (jobRunId) {
        await supabase
          .from("job_runs")
          .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            processed,
            new_offers: newOffers,
            errors: errors + 1,
            log: logs,
          })
          .eq("id", jobRunId);
      }

      console.error("[Worker] Error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Worker failed", 
          details: error.message || String(error) 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("[Worker Edge Function] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Fatal error", 
        details: error.message || String(error) 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// Fonction helper pour envoyer les notifications
async function sendNotification(
  supabase: any,
  channel: string,
  target: string,
  offer: any,
  subscriptionLabel: string,
  userSettings?: any
): Promise<void> {
  const offerLink = `https://www.civiweb.com/offres/detail/${offer.id}`;
  
  const message = `🎯 Nouvelle offre VIE/VIA\n\n` +
    `📌 ${offer.missionTitle || "Titre non disponible"}\n` +
    `🏢 ${offer.organizationName || "Entreprise non spécifiée"}\n` +
    `📍 ${offer.cityNameEn || offer.cityName || "Ville non spécifiée"}\n` +
    `💰 ${offer.indemnite ? `${offer.indemnite}€/mois` : "Non spécifié"}\n` +
    `🔗 ${offerLink}\n\n` +
    `Abonnement: ${subscriptionLabel}`;

  switch (channel) {
    case "telegram": {
      const token = userSettings?.telegram_bot_token || Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (!token) {
        throw new Error("Telegram bot token not configured");
      }

      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: target,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
      }
      break;
    }
    case "discord": {
      const response = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord API error: ${error}`);
      }
      break;
    }
    case "email": {
      // Pour l'email, on utilise SMTP via un service externe ou on log simplement
      console.log(`[Email] Would send to ${target}:\n${message}`);
      // TODO: Implémenter l'envoi d'email si nécessaire
      break;
    }
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}

