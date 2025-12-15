import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { VIEOffer } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channel, target } = body;

    if (!channel || !target) {
      return NextResponse.json(
        { error: "Missing channel or target" },
        { status: 400 }
      );
    }

    // Récupérer les paramètres utilisateur
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Créer une offre de test
    const testOffer: VIEOffer = {
      id: 999999,
      reference: "TEST-001",
      missionTitle: "🎯 Offre de Test VIE/VIA",
      organizationName: "Entreprise Test",
      cityName: "Paris",
      cityNameEn: "Paris",
      countryName: "France",
      countryNameEn: "France",
      missionStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      missionDuration: 12,
      missionType: "VIE",
      teleworkingAvailable: true,
      indemnite: 2000,
      contactURL: "https://example.com",
      missionDescription: "Ceci est une offre de test pour vérifier que vos notifications fonctionnent correctement.",
      activitySectorId: 13,
      studyLevelId: 5,
      companySize: "2",
    };

    const payload = {
      offer: testOffer,
      subscriptionLabel: "Test de notification",
    };

    // Envoyer la notification de test
    try {
      await sendNotification(channel, target, payload, userSettings);
      
      return NextResponse.json({
        success: true,
        message: `Notification de test envoyée avec succès via ${channel}`,
      });
    } catch (notifError: any) {
      console.error(`[Test Notification] Error sending ${channel} notification:`, notifError);
      return NextResponse.json(
        {
          success: false,
          error: notifError.message || "Erreur lors de l'envoi de la notification",
          details: String(notifError),
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Test Notification] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

