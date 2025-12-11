/**
 * Script de vérification complète de Supabase
 * Utilise les variables d'environnement du projet correct
 * Exécutez avec: npx tsx verify-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://knbhidpildgpbmzxaaqe.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Vérification complète de Supabase - VIENOTIF\n");
console.log(`📍 URL du projet: ${supabaseUrl}\n`);

if (!supabaseAnonKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY n'est pas définie !");
  console.log("\n📝 Configurez-la dans .env.local ou sur Vercel");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyEverything() {
  try {
    // 1. Test de connexion
    console.log("1️⃣  Test de connexion...");
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`   ⚠️  Auth: ${authError.message}`);
    } else {
      console.log("   ✅ Connexion Supabase OK");
    }

    // 2. Vérifier les tables
    console.log("\n2️⃣  Vérification des tables:");
    const tables = ["subscriptions", "job_runs", "user_settings", "cached_cities"];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .limit(1);
        
        if (error) {
          if (error.message.includes("relation") || error.message.includes("does not exist")) {
            console.log(`   ❌ Table "${table}" N'EXISTE PAS`);
            console.log(`      → Action requise: Exécutez la migration SQL`);
          } else if (error.message.includes("permission") || error.message.includes("RLS")) {
            console.log(`   ⚠️  Table "${table}" existe mais RLS bloque (normal si non connecté)`);
          } else {
            console.log(`   ⚠️  Table "${table}": ${error.message}`);
          }
        } else {
          console.log(`   ✅ Table "${table}" existe et accessible`);
        }
      } catch (err: any) {
        console.log(`   ❌ Erreur lors de la vérification de "${table}": ${err.message}`);
      }
    }

    // 3. Vérifier la structure des tables (si elles existent)
    console.log("\n3️⃣  Vérification de la structure:");
    
    // Test subscriptions
    try {
      const { error } = await supabase
        .from("subscriptions")
        .select("id, user_id, label, filters, channel, target, seen_offer_ids, is_active, created_at, updated_at")
        .limit(0);
      
      if (error && error.message.includes("does not exist")) {
        console.log("   ❌ Table 'subscriptions' n'existe pas");
      } else if (error) {
        console.log(`   ⚠️  subscriptions: ${error.message}`);
      } else {
        console.log("   ✅ Structure de 'subscriptions' correcte");
      }
    } catch (err: any) {
      console.log(`   ⚠️  subscriptions: ${err.message}`);
    }

    // Test job_runs
    try {
      const { error } = await supabase
        .from("job_runs")
        .select("id, started_at, finished_at, status, processed, new_offers, errors, log")
        .limit(0);
      
      if (error && error.message.includes("does not exist")) {
        console.log("   ❌ Table 'job_runs' n'existe pas");
      } else if (error) {
        console.log(`   ⚠️  job_runs: ${error.message}`);
      } else {
        console.log("   ✅ Structure de 'job_runs' correcte");
      }
    } catch (err: any) {
      console.log(`   ⚠️  job_runs: ${err.message}`);
    }

    // Test user_settings
    try {
      const { error } = await supabase
        .from("user_settings")
        .select("id, user_id, telegram_bot_token, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, created_at, updated_at")
        .limit(0);
      
      if (error && error.message.includes("does not exist")) {
        console.log("   ❌ Table 'user_settings' n'existe pas");
      } else if (error) {
        console.log(`   ⚠️  user_settings: ${error.message}`);
      } else {
        console.log("   ✅ Structure de 'user_settings' correcte");
      }
    } catch (err: any) {
      console.log(`   ⚠️  user_settings: ${err.message}`);
    }

    // 4. Compter les enregistrements (si connecté)
    console.log("\n4️⃣  Statistiques:");
    if (session) {
      try {
        const { count: subCount } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true });
        console.log(`   📊 Subscriptions: ${subCount || 0}`);
      } catch (err) {
        console.log("   ⚠️  Impossible de compter les subscriptions");
      }

      try {
        const { count: runCount } = await supabase
          .from("job_runs")
          .select("*", { count: "exact", head: true });
        console.log(`   📊 Job runs: ${runCount || 0}`);
      } catch (err) {
        console.log("   ⚠️  Impossible de compter les job runs");
      }
    } else {
      console.log("   ℹ️  Connectez-vous pour voir les statistiques");
    }

    console.log("\n✅ Vérification terminée\n");
    
    // Résumé des actions
    console.log("📝 Actions requises si des tables manquent:");
    console.log("   1. Allez sur https://supabase.com/dashboard");
    console.log("   2. Sélectionnez le projet: knbhidpildgpbmzxaaqe");
    console.log("   3. Ouvrez SQL Editor");
    console.log("   4. Copiez-collez le contenu de: supabase/migrations/001_initial_schema.sql");
    console.log("   5. Cliquez sur Run");
    console.log("\n   6. Vérifiez dans Table Editor que les tables existent:");
    console.log("      - subscriptions");
    console.log("      - job_runs");
    console.log("      - user_settings");
    console.log("      - cached_cities");

  } catch (error: any) {
    console.error("❌ Erreur lors de la vérification:", error.message);
  }
}

verifyEverything();

