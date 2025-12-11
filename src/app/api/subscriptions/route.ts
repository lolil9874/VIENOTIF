import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const subscriptionSchema = z.object({
  label: z.string().min(1, "Label is required"),
  filters: z.object({
    countriesIds: z.array(z.string()).optional(),
    geographicZones: z.array(z.string()).optional(),
    missionsDurations: z.array(z.string()).optional(),
    teletravail: z.array(z.string()).optional(),
    missionsTypesIds: z.array(z.string()).optional(),
    activitySectorId: z.array(z.string()).optional(),
    query: z.string().optional(),
    citySearch: z.string().optional(),
    companySearch: z.string().optional(),
    minIndemnite: z.number().optional(),
    maxIndemnite: z.number().optional(),
    startDateAfter: z.string().optional(),
    startDateBefore: z.string().optional(),
    studiesLevelId: z.array(z.string()).optional(),
    companiesSizes: z.array(z.string()).optional(),
  }),
  channel: z.enum(["telegram", "email", "discord"]),
  target: z.string().min(1, "Target is required"),
});

// GET /api/subscriptions - List all subscriptions for current user
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API] Error fetching subscriptions:", error);
      // Si la table n'existe pas, retourner un tableau vide au lieu d'erreur
      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        console.error("[API] Table 'subscriptions' does not exist. Please run the migration SQL.");
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(subscriptions || []);
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validation = subscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { label, filters, channel, target } = validation.data;

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        label,
        filters,
        channel,
        target,
        seen_offer_ids: [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating subscription:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
