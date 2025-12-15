-- Migration pour modifier le cron job de quotidien (9h) à toutes les 5 minutes
-- À exécuter dans l'éditeur SQL de Supabase

-- Modifier le cron job pour qu'il s'exécute toutes les 5 minutes
UPDATE cron.job
SET schedule = '*/5 * * * *'
WHERE jobname = 'vienotif-worker-daily';

-- Vérifier que la modification a été appliquée
SELECT 
  jobid,
  schedule,
  jobname,
  active,
  'Toutes les 5 minutes' as description
FROM cron.job
WHERE jobname = 'vienotif-worker-daily';

