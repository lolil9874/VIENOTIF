import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

// Correct project ID - used for validation
export const CORRECT_SUPABASE_PROJECT_ID = "knbhidpildgpbmzxaaqe";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not defined. Please check your environment variables in Vercel."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Please check your environment variables in Vercel."
    );
  }

  // Validate URL format and warn if wrong project (only in browser)
  if (typeof window !== "undefined") {
    if (!supabaseUrl.includes(CORRECT_SUPABASE_PROJECT_ID)) {
      console.error(
        "❌ CRITICAL: Wrong Supabase project URL detected!",
        "\n═══════════════════════════════════════════════════════",
        "\nCurrent URL:",
        supabaseUrl,
        "\nExpected project ID:",
        CORRECT_SUPABASE_PROJECT_ID,
        "\n\n🔧 FIX REQUIRED:",
        "\n1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables",
        "\n2. Update NEXT_PUBLIC_SUPABASE_URL to:",
        `https://${CORRECT_SUPABASE_PROJECT_ID}.supabase.co`,
        "\n3. Redeploy your application",
        "\n═══════════════════════════════════════════════════════"
      );
    }
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

