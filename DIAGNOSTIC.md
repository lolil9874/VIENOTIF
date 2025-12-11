# 🔍 Diagnostic - "Load Failed"

## Étapes de diagnostic

### 1. Vérifier les variables d'environnement

**Localement** (`.env.local`) :
```bash
# Vérifiez que ces variables existent
NEXT_PUBLIC_SUPABASE_URL=https://knbhidpildgpbmzxaaqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-ici
SUPABASE_SERVICE_ROLE_KEY=votre-clé-ici
```

**Sur Vercel** :
1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Projet → Settings → Environment Variables
3. Vérifiez que les 3 variables sont définies

### 2. Exécuter le script de vérification

```bash
npx tsx check-config.ts
```

Ce script va :
- ✅ Vérifier les variables d'environnement
- ✅ Tester la connexion Supabase
- ✅ Vérifier l'existence des tables

### 3. Vérifier les tables dans Supabase

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez le projet **knbhidpildgpbmzxaaqe**
3. Allez dans **Table Editor**
4. Vérifiez que ces tables existent :
   - ✅ `subscriptions`
   - ✅ `job_runs`
   - ✅ `user_settings`

### 4. Si les tables n'existent pas

1. Allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
4. Cliquez sur **Run**

### 5. Vérifier la console du navigateur

1. Ouvrez votre site
2. Appuyez sur **F12** (console développeur)
3. Regardez les erreurs dans l'onglet **Console**
4. Regardez les requêtes dans l'onglet **Network**

**Erreurs courantes** :

- `"Non authentifié"` → Vous n'êtes pas connecté
- `"relation does not exist"` → Les tables n'existent pas (exécutez la migration)
- `"Invalid API key"` → La clé Supabase est incorrecte
- `"Failed to fetch"` → Problème de connexion réseau ou CORS

### 6. Vérifier l'authentification

1. Allez sur `/login`
2. Connectez-vous ou créez un compte
3. Vérifiez que vous êtes redirigé vers `/`

### 7. Tester les API directement

Ouvrez la console du navigateur et testez :

```javascript
// Tester l'API subscriptions
fetch('/api/subscriptions')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Tester l'API job-runs
fetch('/api/job-runs')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Solutions selon l'erreur

### Erreur : "Non authentifié"
→ Connectez-vous sur `/login`

### Erreur : "relation does not exist"
→ Exécutez la migration SQL dans Supabase

### Erreur : "Invalid API key"
→ Vérifiez les variables d'environnement dans Vercel

### Erreur : "Failed to fetch"
→ Vérifiez que l'URL Supabase est correcte

### Erreur : CORS
→ Vérifiez que l'URL dans Supabase Settings > API correspond à votre domaine

## Vérification rapide

```bash
# 1. Vérifier les variables locales
cat .env.local | grep SUPABASE

# 2. Tester la connexion
npx tsx check-config.ts

# 3. Vérifier les logs Vercel
# Allez sur Vercel Dashboard → Votre projet → Logs
```

