import { SubscriptionFilters, VIEOffer } from "./types";

/**
 * Récupère les offres depuis le cache Supabase au lieu de l'API
 * Beaucoup plus rapide et fiable
 */
export async function getCachedOffers(
  supabase: any,
  filters: SubscriptionFilters
): Promise<VIEOffer[]> {
  let query = supabase
    .from("cached_offers")
    .select("raw_data")
    .order("updated_at", { ascending: false });

  // Filtres SQL directs (plus rapide que post-processing)
  
  // Pays
  if (filters.countriesIds && filters.countriesIds.length > 0) {
    query = query.in("country_id", filters.countriesIds);
  }

  // Type de mission (VIE/VIA)
  if (filters.missionsTypesIds && filters.missionsTypesIds.length > 0) {
    const missionTypes = filters.missionsTypesIds.map((id) => 
      id === "1" ? "VIE" : id === "2" ? "VIA" : null
    ).filter(Boolean);
    if (missionTypes.length > 0) {
      query = query.in("mission_type", missionTypes);
    }
  }

  // Durée
  if (filters.missionsDurations && filters.missionsDurations.length > 0) {
    query = query.in("mission_duration", filters.missionsDurations.map(Number));
  }

  // Télétravail
  if (filters.teletravail && filters.teletravail.includes("1")) {
    query = query.eq("teleworking_available", true);
  }

  // Zone géographique
  if (filters.geographicZones && filters.geographicZones.length > 0) {
    query = query.in("geographic_zone", filters.geographicZones);
  }

  // Secteur d'activité
  if (filters.activitySectorId && filters.activitySectorId.length > 0) {
    query = query.in("activity_sector_id", filters.activitySectorId);
  }

  // Niveau d'études
  if (filters.studiesLevelId && filters.studiesLevelId.length > 0) {
    query = query.in("study_level_id", filters.studiesLevelId);
  }

  // Taille d'entreprise
  if (filters.companiesSizes && filters.companiesSizes.length > 0) {
    query = query.in("company_size", filters.companiesSizes);
  }

  // Date de début après
  const startDateAfter = filters.startDateAfter || filters.missionStartDateAfter;
  if (startDateAfter) {
    query = query.gte("mission_start_date", startDateAfter);
  }

  // Date de début avant
  const startDateBefore = filters.startDateBefore || filters.missionStartDateBefore;
  if (startDateBefore) {
    query = query.lte("mission_start_date", startDateBefore);
  }

  // Indemnité min
  if (filters.minIndemnite !== undefined && filters.minIndemnite !== null) {
    query = query.gte("indemnite", filters.minIndemnite);
  }

  // Indemnité max
  if (filters.maxIndemnite !== undefined && filters.maxIndemnite !== null) {
    query = query.lte("indemnite", filters.maxIndemnite);
  }

  // Mots-clés (recherche dans raw_data JSONB)
  if (filters.query) {
    query = query.or(
      `mission_title.ilike.%${filters.query}%,organization_name.ilike.%${filters.query}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Offers Cache] Error fetching from cache:", error);
    return [];
  }

  // Extraire les données brutes et les convertir en VIEOffer
  const offers: VIEOffer[] = (data || [])
    .map((row: any) => row.raw_data)
    .filter((offer: any) => {
      // Filtrage post-traitement pour les filtres complexes (ville, entreprise)
      
      // Filtre ville (fuzzy)
      const citySearch = filters.citySearch || (filters.cities?.join("|") || "");
      if (citySearch) {
        const cityNames = citySearch.split("|").map((c) => c.trim().toLowerCase());
        const offerCity = (offer.cityName || offer.cityNameEn || "").toLowerCase();
        const cityMatch = cityNames.some((name) => 
          offerCity.includes(name) || name.includes(offerCity.split(",")[0].trim())
        );
        if (!cityMatch) return false;
      }

      // Filtre entreprise (fuzzy)
      const companySearch = filters.companySearch || filters.companyName;
      if (companySearch) {
        const searchLower = companySearch.toLowerCase();
        const companyLower = (offer.organizationName || "").toLowerCase();
        if (!companyLower.includes(searchLower)) return false;
      }

      return true;
    });

  return offers;
}

