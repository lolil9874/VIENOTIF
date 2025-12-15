import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Use anon key for public read access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[API] Supabase credentials not configured");
      return NextResponse.json([], { status: 200 });
    }

    const { createClient: createClientPublic } = await import("@supabase/supabase-js");
    const supabase = createClientPublic(supabaseUrl, supabaseAnonKey);

    // Récupérer tous les pays distincts depuis la base de données avec le nombre de villes
    const { data: countries, error } = await supabase
      .from("cached_cities")
      .select("country_id, country_name")
      .not("country_id", "is", null)
      .order("country_name", { ascending: true });

    if (error) {
      console.error("[API] Error fetching countries from DB:", error);
      return NextResponse.json([]);
    }

    // Grouper par pays et compter les villes
    const countryMap = new Map<string, { name: string; count: number }>();
    
    (countries || []).forEach((item: any) => {
      const id = item.country_id;
      const name = item.country_name || id;
      
      if (countryMap.has(id)) {
        countryMap.get(id)!.count++;
      } else {
        countryMap.set(id, { name, count: 1 });
      }
    });

    // Mapper les noms de pays pour la compatibilité avec emojis
    const countryNameMap: Record<string, string> = {
      "UNITED STATES": "🇺🇸 États-Unis",
      "UNITED KINGDOM": "🇬🇧 Royaume-Uni",
      "GERMANY": "🇩🇪 Allemagne",
      "FRANCE": "🇫🇷 France",
      "SPAIN": "🇪🇸 Espagne",
      "ITALY": "🇮🇹 Italie",
      "BELGIUM": "🇧🇪 Belgique",
      "SWITZERLAND": "🇨🇭 Suisse",
      "NETHERLANDS": "🇳🇱 Pays-Bas",
      "CANADA": "🇨🇦 Canada",
      "CHINA": "🇨🇳 Chine",
      "POLAND": "🇵🇱 Pologne",
      "INDIA": "🇮🇳 Inde",
      "PORTUGAL": "🇵🇹 Portugal",
      "AUSTRALIA": "🇦🇺 Australie",
      "CZECH REPUBLIC": "🇨🇿 République tchèque",
      "JAPAN": "🇯🇵 Japon",
      "SWEDEN": "🇸🇪 Suède",
      "TUNISIA": "🇹🇳 Tunisie",
      "AUSTRIA": "🇦🇹 Autriche",
      "HUNGARY": "🇭🇺 Hongrie",
      "MEXICO": "🇲🇽 Mexique",
      "BRAZIL": "🇧🇷 Brésil",
      "ARGENTINA": "🇦🇷 Argentine",
      "SOUTH KOREA": "🇰🇷 Corée du Sud",
      "UNITED ARAB EMIRATES": "🇦🇪 Émirats Arabes Unis",
      "SINGAPORE": "🇸🇬 Singapour",
      "HONG KONG": "🇭🇰 Hong Kong",
      "THAILAND": "🇹🇭 Thaïlande",
      "VIETNAM": "🇻🇳 Vietnam",
      "MOROCCO": "🇲🇦 Maroc",
      "SOUTH AFRICA": "🇿🇦 Afrique du Sud",
      "NEW ZEALAND": "🇳🇿 Nouvelle-Zélande",
    };

    // Transformer pour le format attendu par le frontend
    const formattedCountries = Array.from(countryMap.entries())
      .map(([id, data]) => {
        const upperName = data.name.toUpperCase();
        // Chercher dans le map, sinon utiliser le nom original avec emoji
        const label = countryNameMap[upperName] || (data.name ? `🇺🇳 ${data.name}` : id);
        return {
          value: id,
          label: label,
          count: data.count,
          // Garder aussi le nom original pour la recherche
          originalName: data.name,
        };
      })
      .sort((a, b) => {
        // Trier par nombre de villes décroissant, puis alphabétiquement
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.label.localeCompare(b.label);
      });

    return NextResponse.json(formattedCountries);
  } catch (error: any) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries", details: error.message },
      { status: 500 }
    );
  }
}

