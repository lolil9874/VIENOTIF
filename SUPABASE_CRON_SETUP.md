# 🔄 Configuration Cron Supabase - VIENOTIF

## ✅ Setup Complété

Un cron job Supabase a été configuré pour remplacer le cron Vercel.

## 📋 Ce qui a été fait

1. **Edge Function créée** : `supabase/functions/worker/index.ts`
   - Contient toute la logique du worker
   - Traite les abonnements actifs
   - Envoie les notifications

2. **Cron job créé** : `vienotif-worker-daily`
   - Schedule: Tous les jours à 9h00 UTC (`0 9 * * *`)
   - Appelle l'Edge Function via `pg_net`

## 🚀 Déploiement de l'Edge Function

Pour déployer l'Edge Function, utilisez le Supabase CLI :

```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier le projet
supabase link --project-ref knbhidpildgpbmzxaaqe

# Déployer la fonction
supabase functions deploy worker

# Configurer les secrets (si nécessaire)
supabase secrets set TELEGRAM_BOT_TOKEN=your-token-here
```

Ou via le Dashboard Supabase:
1. Allez sur [Dashboard Supabase](https://supabase.com/dashboard/project/knbhidpildgpbmzxaaqe/functions)
2. Cliquez sur "Create a new function"
3. Nommez-la "worker"
4. Collez le contenu de `supabase/functions/worker/index.ts`

## ⚙️ Configuration des Variables d'Environnement

L'Edge Function utilise ces variables d'environnement automatiquement :
- `SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_URL` - URL du projet
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role (obligatoire)

Pour les notifications Telegram, configurez :
- `TELEGRAM_BOT_TOKEN` - Optionnel si défini dans user_settings

## 📊 Vérifier le Cron Job

Pour voir les jobs cron :
```sql
SELECT * FROM cron.job WHERE jobname = 'vienotif-worker-daily';
```

Pour voir l'historique d'exécution :
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'vienotif-worker-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

## 🔄 Modifier le Schedule

### Option 1 : Via l'éditeur SQL Supabase (Recommandé)

Pour changer l'heure d'exécution, connectez-vous au Dashboard Supabase > SQL Editor et exécutez :

```sql
-- Pour toutes les 5 minutes
UPDATE cron.job
SET schedule = '*/5 * * * *'
WHERE jobname = 'vienotif-worker-daily';

-- Pour une fois par heure
UPDATE cron.job
SET schedule = '0 * * * *'
WHERE jobname = 'vienotif-worker-daily';

-- Pour une fois par jour à 9h UTC
UPDATE cron.job
SET schedule = '0 9 * * *'
WHERE jobname = 'vienotif-worker-daily';
```

### Option 2 : Via la fonction cron.alter_job

```sql
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'vienotif-worker-daily'),
  schedule := '*/5 * * * *'  -- Toutes les 5 minutes
);
```

**Note :** Le fichier `supabase/migrations/update_cron_schedule.sql` contient le SQL pour modifier le cron à toutes les 5 minutes.

## ⚠️ Important

- Le cron Vercel dans `vercel.json` peut être conservé comme backup
- Assurez-vous que l'Edge Function est déployée avant le premier run
- Les logs sont disponibles dans le Dashboard Supabase > Functions > worker

## 🐛 Troubleshooting

Si le cron ne s'exécute pas :

1. Vérifier que les extensions sont activées :
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_net', 'pg_cron');
```

2. Vérifier que le job est actif :
```sql
SELECT jobname, active FROM cron.job WHERE jobname = 'vienotif-worker-daily';
```

3. Vérifier les erreurs dans les logs :
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'vienotif-worker-daily')
AND status = 'failed'
ORDER BY start_time DESC;
```

