import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for updates
const updateSchema = z.object({
  label: z.string().min(1).optional(),
    filters: z
      .object({
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
      })
      .optional(),
  channel: z.enum(["telegram", "email", "discord"]).optional(),
  target: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/subscriptions/[id] - Get a single subscription
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions/[id] - Update a subscription
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (validation.data.label !== undefined) updateData.label = validation.data.label;
    if (validation.data.filters !== undefined) updateData.filters = validation.data.filters;
    if (validation.data.channel !== undefined) updateData.channel = validation.data.channel;
    if (validation.data.target !== undefined) updateData.target = validation.data.target;
    if (validation.data.isActive !== undefined) updateData.is_active = validation.data.isActive;

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: "Subscription not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] - Delete a subscription
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Subscription not found or delete failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
