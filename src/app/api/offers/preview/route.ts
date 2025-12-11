import { NextRequest, NextResponse } from "next/server";
import { searchOffers } from "@/lib/vie-api";
import { SubscriptionFilters } from "@/lib/types";

// POST preview offers with filters
export async function POST(request: NextRequest) {
  try {
    const filters: SubscriptionFilters = await request.json();
    const offers = await searchOffers(filters);

    // Return only first 10 for preview
    return NextResponse.json({
      offers: offers.slice(0, 10),
      total: offers.length,
    });
  } catch (error) {
    console.error("[API] Error previewing offers:", error);
    return NextResponse.json(
      { error: "Failed to preview offers" },
      { status: 500 }
    );
  }
}

