/**
 * Script de vérification de la configuration Supabase
 * Exécutez avec: npx tsx check-config.ts
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Vérification de la configuration Supabase\n");

// Vérifier les variables d'environnement
console.log("1. Variables d'environnement:");
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅ Définie" : "❌ MANQUANTE"}`);
if (supabaseUrl) {
  console.log(`      Valeur: ${supabaseUrl}`);
  if (supabaseUrl.includes("knbhidpildgpbmzxaaqe")) {
    console.log("      ✅ URL correcte (projet VIENOTIF)");
  } else {
    console.log("      ⚠️  URL incorrecte - devrait être knbhidpildgpbmzxaaqe.supabase.co");
  }
}

console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✅ Définie" : "❌ MANQUANTE"}`);
if (supabaseAnonKey) {
  console.log(`      Longueur: ${supabaseAnonKey.length} caractères`);
}

console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? "✅ Définie" : "⚠️  Non définie (optionnel)"}`);
if (supabaseServiceKey) {
  console.log(`      Longueur: ${supabaseServiceKey.length} caractères`);
}

console.log("\n2. Test de connexion Supabase:");

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("   ❌ Impossible de tester - variables manquantes");
  console.log("\n📝 Actions requises:");
  console.log("   1. Créez un fichier .env.local à la racine du projet");
  console.log("   2. Ajoutez les variables d'environnement (voir SETUP_SUPABASE.md)");
  process.exit(1);
}

// Tester la connexion
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  try {
    // Test 1: Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`   ⚠️  Auth: ${authError.message}`);
    } else {
      console.log("   ✅ Connexion Supabase OK");
    }

    // Test 2: Vérifier les tables
    console.log("\n3. Vérification des tables:");
    
    const tables = ["subscriptions", "job_runs", "user_settings"];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .limit(1);
        
        if (error) {
          if (error.message.includes("relation") || error.message.includes("does not exist")) {
            console.log(`   ❌ Table "${table}" n'existe pas`);
            console.log(`      → Exécutez la migration SQL dans Supabase`);
          } else if (error.message.includes("permission") || error.message.includes("RLS")) {
            console.log(`   ⚠️  Table "${table}" existe mais RLS bloque l'accès`);
          } else {
            console.log(`   ⚠️  Table "${table}": ${error.message}`);
          }
        } else {
          console.log(`   ✅ Table "${table}" existe et accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Erreur lors de la vérification de "${table}": ${err}`);
      }
    }

    console.log("\n✅ Vérification terminée");
    console.log("\n📝 Si des tables manquent:");
    console.log("   1. Allez sur https://supabase.com/dashboard");
    console.log("   2. Sélectionnez votre projet (knbhidpildgpbmzxaaqe)");
    console.log("   3. Ouvrez SQL Editor");
    console.log("   4. Exécutez le contenu de supabase/migrations/001_initial_schema.sql");

  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

checkConnection();

