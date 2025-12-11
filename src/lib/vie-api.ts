import { VIEAPIResponse, VIESearchFilters, VIEOffer, SubscriptionFilters } from "./types";
import Fuse from "fuse.js";

const API_URL = "https://civiweb-api-prd.azurewebsites.net/api/Offers/search";

const DEFAULT_FILTERS: VIESearchFilters = {
  limit: 100,
  skip: 0,
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
};

export async function searchOffers(
  filters: SubscriptionFilters = {}
): Promise<VIEOffer[]> {
  const payload: VIESearchFilters = {
    ...DEFAULT_FILTERS,
    countriesIds: filters.countriesIds || [],
    geographicZones: filters.geographicZones || [],
    missionsDurations: filters.missionsDurations || [],
    teletravail: filters.teletravail || [],
    missionsTypesIds: filters.missionsTypesIds || [],
    activitySectorId: filters.activitySectorId || [],
    studiesLevelId: filters.studiesLevelId || [],
    companiesSizes: filters.companiesSizes || [],
    query: filters.query || null,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: VIEAPIResponse = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("[VIE API] Error fetching offers:", error);
    throw error;
  }
}

// Post-processing filters (client-side filtering)
export function filterOffers(offers: VIEOffer[], filters: SubscriptionFilters): VIEOffer[] {
  let filtered = offers;

  // Fuzzy City filter
  const citySearch = filters.citySearch || (filters.cities?.join("|") || "");
  if (citySearch) {
    const cityNames = citySearch.split("|").map((c) => c.trim()).filter(Boolean);
    if (cityNames.length > 0) {
      const fuse = new Fuse(filtered, {
        keys: ["cityName", "cityNameEn"],
        threshold: 0.3, // Adjust threshold for fuzziness (0 = exact match, 1 = match anything)
        includeScore: true,
      });
      const matchedOffers = new Set<VIEOffer>();
      cityNames.forEach((cityQuery) => {
        const results = fuse.search(cityQuery);
        results.forEach((result) => matchedOffers.add(result.item));
      });
      filtered = filtered.filter((offer) => matchedOffers.has(offer));
    }
  }

  // Fuzzy Company Name filter
  const companySearch = filters.companySearch || filters.companyName;
  if (companySearch) {
    const fuse = new Fuse(filtered, {
      keys: ["organizationName"],
      threshold: 0.3,
      includeScore: true,
    });
    const results = fuse.search(companySearch);
    filtered = results.map((result) => result.item);
  }

  // Min indemnity
  if (filters.minIndemnite !== undefined && filters.minIndemnite !== null) {
    filtered = filtered.filter((offer) => offer.indemnite >= filters.minIndemnite!);
  }

  // Max indemnity
  if (filters.maxIndemnite !== undefined && filters.maxIndemnite !== null) {
    filtered = filtered.filter((offer) => offer.indemnite <= filters.maxIndemnite!);
  }

  // Start date after
  const startDateAfter = filters.startDateAfter || filters.missionStartDateAfter;
  if (startDateAfter) {
    const filterDate = new Date(startDateAfter);
    filtered = filtered.filter((offer) => new Date(offer.missionStartDate) >= filterDate);
  }

  // Start date before
  const startDateBefore = filters.startDateBefore || filters.missionStartDateBefore;
  if (startDateBefore) {
    const filterDate = new Date(startDateBefore);
    filtered = filtered.filter((offer) => new Date(offer.missionStartDate) <= filterDate);
  }

  return filtered;
}

export function getOfferLink(offer: VIEOffer): string {
  return `https://mon-vie-via.businessfrance.fr/offre/${offer.id}`;
}

export function formatOfferForNotification(offer: VIEOffer): string {
  const startDate = new Date(offer.missionStartDate).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  });

  return `🆕 *Nouvelle offre VIE*

📋 *${offer.missionTitle}*
🏢 ${offer.organizationName}
📍 ${offer.cityName}, ${offer.countryNameEn}
📅 Début: ${startDate}
⏱️ Durée: ${offer.missionDuration} mois
💶 Indemnité: ${offer.indemnite}€/mois
${offer.teleworkingAvailable ? "🏠 Télétravail disponible" : ""}

🔗 [Voir l'offre](${getOfferLink(offer)})`;
}

export function formatOfferForEmail(offer: VIEOffer): string {
  const startDate = new Date(offer.missionStartDate).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  });

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">🆕 Nouvelle offre VIE</h2>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #1e293b;">${offer.missionTitle}</h3>
        <p><strong>🏢 Entreprise:</strong> ${offer.organizationName}</p>
        <p><strong>📍 Lieu:</strong> ${offer.cityName}, ${offer.countryNameEn}</p>
        <p><strong>📅 Début:</strong> ${startDate}</p>
        <p><strong>⏱️ Durée:</strong> ${offer.missionDuration} mois</p>
        <p><strong>💶 Indemnité:</strong> ${offer.indemnite}€/mois</p>
        ${offer.teleworkingAvailable ? "<p><strong>🏠</strong> Télétravail disponible</p>" : ""}
      </div>
      <a href="${getOfferLink(offer)}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Voir l'offre →
      </a>
    </div>
  `;
}
