import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_URL = "https://civiweb-api-prd.azurewebsites.net/api/Offers/search";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification (optionnel, mais recommandé)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("[Cities Sync] Starting synchronization...");

    // Récupérer TOUTES les offres (avec plusieurs requêtes si nécessaire)
    const allOffers: any[] = [];
    let skip = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          skip,
          query: null,
          geographicZones: [],
          countriesIds: [],
          teletravail: [],
          porteEnv: [],
          activitySectorId: [],
          missionsTypesIds: [],
          missionsDurations: [],
          studiesLevelId: [],
          companiesSizes: [],
          specializationsIds: [],
          entreprisesIds: [0],
          missionStartDate: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const offers = data.result || [];
      
      if (offers.length === 0) {
        hasMore = false;
      } else {
        allOffers.push(...offers);
        skip += limit;
        
        // Limite de sécurité : max 10 000 offres
        if (allOffers.length >= 10000) {
          hasMore = false;
        }
      }
    }

    console.log(`[Cities Sync] Fetched ${allOffers.length} offers`);

    // Extraire toutes les villes uniques avec leurs pays
    const cityMap = new Map<string, {
      city_name: string;
      city_name_en: string | null;
      country_id: string | null;
      country_name: string | null;
      offer_count: number;
    }>();

    for (const offer of allOffers) {
      const cityName = offer.cityName || offer.cityNameEn || null;
      const cityNameEn = offer.cityNameEn || offer.cityName || null;
      const countryId = offer.countryId || null;
      const countryName = offer.countryNameEn || offer.countryName || null;

      if (cityName) {
        // Utiliser city_name comme clé unique
        const key = cityName.toLowerCase().trim();
        const existing = cityMap.get(key);

        if (existing) {
          existing.offer_count++;
          // Mettre à jour les noms si plus complets
          if (cityNameEn && !existing.city_name_en) {
            existing.city_name_en = cityNameEn;
          }
          if (countryName && !existing.country_name) {
            existing.country_name = countryName;
          }
          if (countryId && !existing.country_id) {
            existing.country_id = countryId;
          }
        } else {
          cityMap.set(key, {
            city_name: cityName,
            city_name_en: cityNameEn,
            country_id: countryId,
            country_name: countryName,
            offer_count: 1,
          });
        }
      }
    }

    console.log(`[Cities Sync] Found ${cityMap.size} unique cities`);

    // Insérer ou mettre à jour dans la base de données
    const cities = Array.from(cityMap.values());
    let inserted = 0;
    let updated = 0;

    for (const city of cities) {
      // Vérifier si la ville existe déjà
      const { data: existing } = await supabase
        .from("cached_cities")
        .select("id, offer_count")
        .eq("city_name", city.city_name)
        .single();

      if (existing) {
        // Mettre à jour si le nombre d'offres a changé
        if (existing.offer_count !== city.offer_count) {
          await supabase
            .from("cached_cities")
            .update({
              city_name_en: city.city_name_en,
              country_id: city.country_id,
              country_name: city.country_name,
              offer_count: city.offer_count,
              last_seen_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          updated++;
        } else {
          // Mettre à jour last_seen_at même si offer_count n'a pas changé
          await supabase
            .from("cached_cities")
            .update({
              last_seen_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
      } else {
        // Insérer nouvelle ville
        await supabase
          .from("cached_cities")
          .insert({
            city_name: city.city_name,
            city_name_en: city.city_name_en,
            country_id: city.country_id,
            country_name: city.country_name,
            offer_count: city.offer_count,
            last_seen_at: new Date().toISOString(),
          });
        inserted++;
      }
    }

    console.log(`[Cities Sync] Inserted: ${inserted}, Updated: ${updated}`);

    return NextResponse.json({
      success: true,
      total_offers: allOffers.length,
      unique_cities: cityMap.size,
      inserted,
      updated,
      message: `Synchronisation réussie : ${inserted} nouvelles villes, ${updated} mises à jour`,
    });
  } catch (error: any) {
    console.error("[Cities Sync] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation", details: error.message },
      { status: 500 }
    );
  }
}

