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

    console.log("[Offers Sync] Starting synchronization...");

    // Récupérer TOUTES les offres (avec plusieurs requêtes si nécessaire)
    const allOffers: any[] = [];
    let skip = 0;
    const limit = 1000;
    let hasMore = true;
    let totalFetched = 0;

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
        totalFetched += offers.length;
        skip += limit;
        
        console.log(`[Offers Sync] Fetched ${totalFetched} offers so far...`);
        
        // Limite de sécurité : max 20 000 offres
        if (allOffers.length >= 20000) {
          hasMore = false;
          console.log("[Offers Sync] Reached safety limit of 20,000 offers");
        }
      }
    }

    console.log(`[Offers Sync] Total offers fetched: ${allOffers.length}`);

    // Préparer les données pour insertion
    const offersToInsert = allOffers.map((offer) => ({
      id: offer.id,
      mission_title: offer.missionTitle || "",
      organization_name: offer.organizationName || null,
      city_name: offer.cityName || null,
      city_name_en: offer.cityNameEn || null,
      country_id: offer.countryId || null,
      country_name: offer.countryName || null,
      country_name_en: offer.countryNameEn || null,
      indemnite: offer.indemnite || null,
      mission_start_date: offer.missionStartDate ? new Date(offer.missionStartDate).toISOString().split('T')[0] : null,
      mission_duration: offer.missionDuration || null,
      teleworking_available: offer.teleworkingAvailable || false,
      mission_type: offer.missionType === 1 ? 'VIE' : offer.missionType === 2 ? 'VIA' : null,
      activity_sector_id: offer.activitySectorId ? String(offer.activitySectorId) : null,
      study_level_id: offer.studiesLevelId ? String(offer.studiesLevelId) : null,
      company_size: offer.companiesSize ? String(offer.companiesSize) : null,
      geographic_zone: offer.geographicZone ? String(offer.geographicZone) : null,
      raw_data: offer, // Stocker toutes les données originales
      updated_at: new Date().toISOString(),
    }));

    // Récupérer les IDs existants pour compter les mises à jour
    const { data: existingOffers } = await supabase
      .from("cached_offers")
      .select("id");
    
    const existingIds = new Set((existingOffers || []).map(o => o.id));
    const currentOfferIds = offersToInsert.map(o => o.id);
    
    // Supprimer les offres qui ne sont plus dans l'API
    const idsToDelete = Array.from(existingIds).filter(id => !currentOfferIds.includes(id));
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("cached_offers")
        .delete()
        .in("id", idsToDelete);
      
      if (deleteError) {
        console.warn("[Offers Sync] Error deleting old offers:", deleteError);
      } else {
        console.log(`[Offers Sync] Deleted ${idsToDelete.length} old offers`);
      }
    }

    // Insérer ou mettre à jour par lots de 500
    let inserted = 0;
    let updated = 0;
    const batchSize = 500;

    for (let i = 0; i < offersToInsert.length; i += batchSize) {
      const batch = offersToInsert.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from("cached_offers")
        .upsert(batch, {
          onConflict: "id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`[Offers Sync] Error upserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      } else {
        // Compter les nouvelles vs mises à jour
        batch.forEach(offer => {
          if (existingIds.has(offer.id)) {
            updated++;
          } else {
            inserted++;
          }
        });
      }
    }

    console.log(`[Offers Sync] Inserted: ${inserted}, Updated: ${updated}`);

    // Mettre à jour les villes en même temps
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
        const key = cityName.toLowerCase().trim();
        const existing = cityMap.get(key);

        if (existing) {
          existing.offer_count++;
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

    // Mettre à jour les villes
    let citiesInserted = 0;
    let citiesUpdated = 0;

    for (const city of cityMap.values()) {
      const { data: existing } = await supabase
        .from("cached_cities")
        .select("id, offer_count")
        .eq("city_name", city.city_name)
        .single();

      if (existing) {
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
        citiesUpdated++;
      } else {
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
        citiesInserted++;
      }
    }

    return NextResponse.json({
      success: true,
      total_offers: allOffers.length,
      offers_inserted: inserted,
      offers_updated: updated,
      cities_inserted: citiesInserted,
      cities_updated: citiesUpdated,
      message: `Synchronisation réussie : ${inserted} nouvelles offres, ${updated} mises à jour, ${citiesInserted} nouvelles villes`,
    });
  } catch (error: any) {
    console.error("[Offers Sync] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation", details: error.message },
      { status: 500 }
    );
  }
}

