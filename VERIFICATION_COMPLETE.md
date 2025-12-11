# ✅ Vérification Complète - VIENOTIF

## ⚠️ Problème identifié

Le **MCP Supabase est connecté au mauvais projet** :
- ❌ Projet actuel MCP : `ddxjaxvrgeihkgmrnmqp.supabase.co`
- ✅ Projet correct : `knbhidpildgpbmzxaaqe.supabase.co`

C'est pour ça que les vérifications MCP échouent avec des timeouts.

## 🔧 Solution : Script de vérification

J'ai créé un script qui utilise **vos variables d'environnement** (le bon projet) :

```bash
# Vérifier la configuration complète
npm run verify
# ou
npx tsx verify-supabase.ts
```

Ce script va :
1. ✅ Vérifier la connexion Supabase
2. ✅ Vérifier l'existence des 4 tables
3. ✅ Vérifier la structure des tables
4. ✅ Afficher les statistiques
5. ✅ Donner des instructions si quelque chose manque

## 📋 Checklist de vérification

### 1. Variables d'environnement

**Localement** (`.env.local`) :
```env
NEXT_PUBLIC_SUPABASE_URL=https://knbhidpildgpbmzxaaqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-ici
SUPABASE_SERVICE_ROLE_KEY=votre-clé-ici
```

**Sur Vercel** :
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://knbhidpildgpbmzxaaqe.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anon
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = votre clé service role

### 2. Tables dans Supabase

Allez sur [supabase.com/dashboard](https://supabase.com/dashboard) → Projet `knbhidpildgpbmzxaaqe` → **Table Editor**

Vérifiez que ces tables existent :
- ✅ `subscriptions`
- ✅ `job_runs`
- ✅ `user_settings`
- ✅ `cached_cities`

### 3. Si les tables n'existent pas

1. Allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
4. Cliquez sur **Run**
5. Vérifiez dans **Table Editor** que les tables sont créées

### 4. Vérifier l'authentification

1. Allez sur `/login`
2. Créez un compte ou connectez-vous
3. Vérifiez que vous êtes redirigé vers `/`

### 5. Tester le chargement des données

1. Ouvrez la console du navigateur (F12)
2. Allez sur la page principale `/`
3. Vérifiez qu'il n'y a pas d'erreurs "load failed"
4. Les données devraient se charger (même si les listes sont vides)

## 🐛 Diagnostic du "Load Failed"

Si vous avez toujours "load failed" :

1. **Exécutez le script de vérification** :
   ```bash
   npm run verify
   ```

2. **Vérifiez la console du navigateur** (F12) :
   - Regardez les erreurs dans l'onglet **Console**
   - Regardez les requêtes dans l'onglet **Network**

3. **Erreurs courantes** :
   - `"relation does not exist"` → Exécutez la migration SQL
   - `"Non authentifié"` → Connectez-vous sur `/login`
   - `"Invalid API key"` → Vérifiez les variables d'environnement sur Vercel
   - `"Failed to fetch"` → Vérifiez l'URL Supabase

## 📝 Commandes utiles

```bash
# Vérifier la configuration
npm run verify

# Vérifier les variables d'environnement
npm run check

# Lancer en développement
npm run dev
```

## ✅ Résumé

Le code est **prêt et corrigé**. Le problème "load failed" vient probablement de :

1. **Tables manquantes** → Exécutez la migration SQL dans Supabase
2. **Variables d'environnement incorrectes** → Vérifiez sur Vercel
3. **Non authentifié** → Connectez-vous sur `/login`

**Action immédiate** : Exécutez `npm run verify` pour un diagnostic complet !

