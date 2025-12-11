import { NextResponse } from "next/server";

const API_URL = "https://civiweb-api-prd.azurewebsites.net/api/Offers/search";

// Cache cities for 1 hour
let cachedCities: { name: string; country: string; count: number }[] = [];
let lastFetch = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    // Return cached if valid
    if (cachedCities.length > 0 && Date.now() - lastFetch < CACHE_TTL) {
      return NextResponse.json(cachedCities);
    }

    // Fetch all offers to extract cities
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 1000,
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
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const offers = data.result || [];

    // Extract and count unique cities
    const cityCounts = new Map<string, { country: string; count: number }>();
    
    for (const offer of offers) {
      const cityName = offer.cityName || offer.cityNameEn;
      const countryName = offer.countryNameEn || offer.countryName;
      
      if (cityName) {
        const key = `${cityName}|${countryName}`;
        const existing = cityCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityCounts.set(key, { country: countryName || "", count: 1 });
        }
      }
    }

    // Convert to array and sort by count
    cachedCities = Array.from(cityCounts.entries())
      .map(([key, value]) => ({
        name: key.split("|")[0],
        country: value.country,
        count: value.count,
      }))
      .sort((a, b) => b.count - a.count);

    lastFetch = Date.now();

    return NextResponse.json(cachedCities);
  } catch (error) {
    console.error("[API] Error fetching cities:", error);
    // Return cached even if stale on error
    if (cachedCities.length > 0) {
      return NextResponse.json(cachedCities);
    }
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

