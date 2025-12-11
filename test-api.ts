// Test script to analyze the VIE API response structure
// Run with: npx tsx test-api.ts

const API_URL = "https://civiweb-api-prd.azurewebsites.net/api/Offers/search";

const payload = {
  limit: 5,
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

async function testAPI() {
  console.log("🔍 Testing VIE API...\n");
  console.log("Request payload:", JSON.stringify(payload, null, 2));
  console.log("\n---\n");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("✅ API Response received!\n");
    console.log("📊 Full response structure:");
    console.log(JSON.stringify(data, null, 2));

    // Analyze structure
    console.log("\n---\n");
    console.log("📋 ANALYSIS:");
    console.log("Response type:", typeof data);
    console.log("Is array:", Array.isArray(data));

    if (Array.isArray(data) && data.length > 0) {
      console.log("\n📝 First offer structure:");
      const firstOffer = data[0];
      console.log("Keys:", Object.keys(firstOffer));
      console.log("\nDetailed first offer:");
      console.log(JSON.stringify(firstOffer, null, 2));
    } else if (data && typeof data === "object") {
      console.log("\nResponse keys:", Object.keys(data));
      if (data.offers || data.results || data.items || data.data) {
        const offers = data.offers || data.results || data.items || data.data;
        console.log("\n📝 First offer structure:");
        if (offers.length > 0) {
          console.log("Keys:", Object.keys(offers[0]));
          console.log("\nDetailed first offer:");
          console.log(JSON.stringify(offers[0], null, 2));
        }
      }
    }
  } catch (error) {
    console.error("❌ Error calling API:", error);
  }
}

testAPI();

