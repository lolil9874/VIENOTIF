import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

const API_URL = "https://civiweb-api-prd.azurewebsites.net/api/Offers/search";

// Use service role for sync (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  try {
    // Verify environment variables
    if (!supabaseUrl) {
      console.error("[Cities Sync] NEXT_PUBLIC_SUPABASE_URL is not set");
      return NextResponse.json({ error: "Server configuration error: Supabase URL not set" }, { status: 500 });
    }

    if (!supabaseServiceKey) {
      console.error("[Cities Sync] SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
      return NextResponse.json({ error: "Server configuration error: Supabase key not set" }, { status: 500 });
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseServiceKey);

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
    
    // Get existing cities to count inserted vs updated
    const { data: existingCities } = await supabase
      .from("cached_cities")
      .select("city_name");
    
    const existingCityNames = new Set(existingCities?.map(c => c.city_name) || []);
    
    // Use upsert for better performance (batch operation)
    const citiesToUpsert = cities.map((city) => ({
      city_name: city.city_name,
      city_name_en: city.city_name_en,
      country_id: city.country_id,
      country_name: city.country_name,
      offer_count: city.offer_count,
      last_seen_at: new Date().toISOString(),
    }));

    // Upsert all cities in batches of 100 to avoid payload size issues
    let inserted = 0;
    let updated = 0;
    const batchSize = 100;
    
    for (let i = 0; i < citiesToUpsert.length; i += batchSize) {
      const batch = citiesToUpsert.slice(i, i + batchSize);
      
      const { error: upsertError } = await supabase
        .from("cached_cities")
        .upsert(batch, {
          onConflict: "city_name",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error(`[Cities Sync] Error upserting cities batch ${i}-${i + batch.length}:`, upsertError);
        // Continue with next batch instead of throwing
      } else {
        // Count inserted vs updated for this batch
        const batchInserted = batch.filter(c => !existingCityNames.has(c.city_name)).length;
        const batchUpdated = batch.filter(c => existingCityNames.has(c.city_name)).length;
        inserted += batchInserted;
        updated += batchUpdated;
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

