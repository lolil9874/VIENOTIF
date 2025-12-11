import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Récupérer toutes les villes depuis la base de données
    const { data: cities, error } = await supabase
      .from("cached_cities")
      .select("*")
      .order("offer_count", { ascending: false })
      .order("city_name", { ascending: true });

    if (error) {
      console.error("[API] Error fetching cities from DB:", error);
      // Si la table n'existe pas ou est vide, retourner un tableau vide
      return NextResponse.json([]);
    }

    // Transformer pour le format attendu par le frontend
    const formattedCities = (cities || []).map((city) => ({
      value: city.city_name,
      label: city.city_name_en || city.city_name,
      country: city.country_name || "",
      count: city.offer_count || 0,
      // Ajouter les infos supplémentaires pour l'affichage
      city_name: city.city_name,
      city_name_en: city.city_name_en,
      country_id: city.country_id,
      country_name: city.country_name,
    }));

    return NextResponse.json(formattedCities);
  } catch (error: any) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities", details: error.message },
      { status: 500 }
    );
  }
}

