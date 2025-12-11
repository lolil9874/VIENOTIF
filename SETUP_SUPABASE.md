# 🔧 Configuration Supabase - VIENOTIF

## ✅ Projet Supabase

**URL du projet** : `https://knbhidpildgpbmzxaaqe.supabase.co`

## 📋 Variables d'environnement à configurer

### 1. Localement (`.env.local`)

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://knbhidpildgpbmzxaaqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

### 2. Sur Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **VIENOTIF**
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez/modifiez ces variables :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://knbhidpildgpbmzxaaqe.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre clé anon (récupérée dans Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Votre clé service role (récupérée dans Supabase) |
| `CRON_SECRET` | (Optionnel) Un secret pour protéger `/api/worker` |

5. Cliquez sur **Save**
6. **Redéployez** votre application (ou attendez le déploiement automatique)

## 🔑 Récupérer les clés Supabase

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **VIENOTIF** (`knbhidpildgpbmzxaaqe`)
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRET - Ne partagez jamais cette clé !**

## 🗄️ Migration de la base de données

1. Allez dans votre dashboard Supabase
2. Ouvrez **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
5. Cliquez sur **Run**

## 🔐 Désactiver la vérification email

1. Dans votre dashboard Supabase
2. Allez dans **Authentication** > **Settings**
3. Trouvez **"User Management"** > **"Enable email confirmations"**
4. **Désactivez** le toggle
5. Cliquez sur **Save**

## ✅ Vérification

Après avoir configuré les variables :

1. **Localement** : Redémarrez `npm run dev`
2. **Sur Vercel** : Attendez le redéploiement ou redéployez manuellement
3. Testez la création d'un compte sur votre site
4. Vérifiez les logs dans la console du navigateur (F12)

## 🐛 Problèmes courants

### "Invalid login credentials"
- Vérifiez que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correct
- Vérifiez que la vérification email est désactivée

### "Failed to create job run"
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configuré
- Vérifiez que les tables existent (exécutez la migration)

### Redirection vers login Vercel
- Vérifiez que `/api/worker` est bien exclu du middleware (déjà fait dans le code)

