import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/job-runs - List recent job runs
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: jobRuns, error } = await supabase
      .from("job_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[API] Error fetching job runs:", error);
      // Si la table n'existe pas, retourner un tableau vide au lieu d'erreur
      if (error.message.includes("relation") || error.message.includes("does not exist")) {
        console.error("[API] Table 'job_runs' does not exist. Please run the migration SQL.");
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(jobRuns || []);
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
