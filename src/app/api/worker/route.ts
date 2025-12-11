import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { searchOffers, filterOffers, getOfferLink, formatOfferForNotification } from "@/lib/vie-api";
import { sendNotification } from "@/lib/notifications";
import { SubscriptionFilters, VIEOffer } from "@/lib/types";

// Use service role for worker (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  // Optional: Verify cron secret if provided (for external cron services)
  // If CRON_SECRET is not set in environment variables, the endpoint is publicly accessible
  const cronSecret = process.env.CRON_SECRET;
  
  // Only check secret if it's actually configured
  if (cronSecret && cronSecret.trim() !== "") {
    const authHeader = request.headers.get("authorization");
    const url = new URL(request.url);
    const urlSecret = url.searchParams.get("secret");
    
    // Allow both Bearer token and URL parameter
    const isValid = authHeader === `Bearer ${cronSecret}` || urlSecret === cronSecret;
    
    if (!isValid) {
      console.log("[Worker] Unauthorized access attempt - CRON_SECRET mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.log("[Worker] Endpoint accessed without CRON_SECRET (public access)");
  }

  const supabase = createServerClient(supabaseUrl, supabaseServiceKey);
  const logs: string[] = [];
  let processed = 0;
  let newOffers = 0;
  let errors = 0;

  // Create job run record
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

  if (createError) {
    console.error("Failed to create job run:", createError);
    return NextResponse.json({ error: "Failed to create job run" }, { status: 500 });
  }

  const jobRunId = jobRun.id;
  logs.push(`[${new Date().toISOString()}] Worker started`);

  try {
    // Fetch all active subscriptions
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
      for (const sub of subscriptions) {
        try {
          processed++;
          const filters: SubscriptionFilters = sub.filters as SubscriptionFilters || {};
          logs.push(`Processing subscription: ${sub.label}`);

          // Fetch offers from API
          let offers = await searchOffers(filters);

          // Apply post-processing filters (city, company, etc.)
          offers = filterOffers(offers, filters);

          // Get seen offer IDs
          const seenIds = new Set<number>(
            Array.isArray(sub.seen_offer_ids) ? sub.seen_offer_ids : []
          );

          // Find new offers
          const newOffersList = offers.filter((offer) => !seenIds.has(offer.id));

          if (newOffersList.length > 0) {
            logs.push(`Found ${newOffersList.length} new offers for ${sub.label}`);

            // Get user settings for notification credentials (if needed)
            const { data: userSettings } = await supabase
              .from("user_settings")
              .select("*")
              .eq("user_id", sub.user_id)
              .single();

            // Send notifications for each new offer
            for (const offer of newOffersList.slice(0, 10)) {
              // Limit to 10 per subscription per run
              try {
                await sendNotification(sub.channel, sub.target, {
                  offer,
                  subscriptionLabel: sub.label,
                }, userSettings);
                newOffers++;
                logs.push(`Notification sent for offer: ${offer.missionTitle}`);
              } catch (notifError) {
                errors++;
                logs.push(`Failed to send notification: ${notifError}`);
              }
            }

            // Update seen offer IDs
            const updatedSeenIds = [
              ...Array.from(seenIds),
              ...newOffersList.map((o) => o.id),
            ];

            await supabase
              .from("subscriptions")
              .update({ seen_offer_ids: updatedSeenIds })
              .eq("id", sub.id);
          } else {
            logs.push(`No new offers for ${sub.label}`);
          }
        } catch (subError) {
          errors++;
          logs.push(`Error processing ${sub.label}: ${subError}`);
        }
      }
    }

    // Update job run as success
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

    logs.push(`[${new Date().toISOString()}] Worker completed`);

    return NextResponse.json({
      success: true,
      processed,
      newOffers,
      errors,
    });
  } catch (error) {
    logs.push(`[${new Date().toISOString()}] Worker failed: ${error}`);

    // Update job run as failed
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

    console.error("Worker error:", error);
    return NextResponse.json(
      { error: "Worker failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for cron services (cron-job.org, etc.)
export async function GET(request: Request) {
  return POST(request);
}
