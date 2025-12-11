# 🌍 VIENOTIF

**Plateforme d'alertes pour les offres VIE/VIA (Volontariat International en Entreprise)**

VIENOTIF surveille automatiquement les nouvelles offres VIE/VIA sur [Business France](https://mon-vie-via.businessfrance.fr/) et vous envoie des notifications personnalisées par Telegram, Discord ou Email.

![Login](docs/login.png)

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** - Email/mot de passe avec Supabase Auth
- 🔍 **Filtres avancés** - Pays, villes, secteurs d'activité, niveau d'études, taille d'entreprise, indemnité, dates
- 🔔 **Multi-canaux** - Telegram, Discord, Email
- 🤖 **Vérification automatique** - Toutes les 15 minutes via cron
- 📱 **Interface mobile-friendly** - Design responsive moderne
- 🌐 **Recherche fuzzy** - Recherche intelligente avec normalisation des accents

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com) (gratuit)

### Installation

```bash
# Cloner le repo
git clone https://github.com/yourusername/vienotif.git
cd vienotif

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
```

### Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Récupérez vos clés API dans Settings > API
3. Configurez `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://knbhidpildgpbmzxaaqe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**⚠️ Important** : Remplacez `your-anon-key` et `your-service-role-key` par les vraies clés de votre projet Supabase.

4. Exécutez la migration SQL dans votre dashboard Supabase (SQL Editor) :
   - Ouvrez le SQL Editor dans votre dashboard Supabase
   - Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
   - Exécutez la requête

5. **Désactiver la vérification email (recommandé pour le développement)** :
   - Allez dans **Authentication** > **Settings** dans votre dashboard Supabase
   - Trouvez la section **"User Management"**
   - **Désactivez** "Enable email confirmations"
   - Cliquez sur **Save**
   
   ⚠️ **Important** : Si vous gardez la vérification email activée, vous devez configurer un SMTP personnalisé dans Supabase (voir section ci-dessous).

### Lancer en développement

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration des notifications

### Telegram

1. Créez un bot via [@BotFather](https://t.me/BotFather)
2. Obtenez votre Chat ID via [@userinfobot](https://t.me/userinfobot)
3. Configurez le token dans la page Paramètres ou en variable d'environnement

### Discord

1. Créez un webhook dans les paramètres de votre serveur Discord
2. Copiez l'URL du webhook
3. Utilisez cette URL comme "cible" dans vos souscriptions

### Email

1. Configurez un serveur SMTP dans la page Paramètres
2. Pour Gmail, utilisez un [mot de passe d'application](https://myaccount.google.com/apppasswords)

## 📦 Déploiement

### Vercel (recommandé)

1. Importez le repo sur [Vercel](https://vercel.com)
2. Configurez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (recommandé pour le worker)
3. Le cron job Vercel s'exécute une fois par jour (limite plan Hobby)
4. Pour des vérifications plus fréquentes, utilisez **Uptime Robot** (gratuit et fiable) :
   - Voir la section "Configuration Uptime Robot" ci-dessous

### Configuration Uptime Robot (recommandé pour vérifications fréquentes)

[Uptime Robot](https://uptimerobot.com) est un service gratuit et fiable pour surveiller votre endpoint et déclencher le worker automatiquement.

**Étapes de configuration :**

1. **Créer un compte** sur [uptimerobot.com](https://uptimerobot.com) (gratuit, jusqu'à 50 monitors)

2. **Ajouter un nouveau monitor :**
   - Cliquez sur "Add New Monitor" (ou "Monitors" > "Add New Monitor")
   - **Monitor Type** : Sélectionnez "HTTP(s)"
   - **Friendly Name** : `VIENOTIF Worker`
   - **URL (or IP)** : `https://votre-app.vercel.app/api/worker`
     - Remplacez `votre-app.vercel.app` par l'URL de votre déploiement Vercel
   - **Monitoring Interval** : `5 minutes` (minimum gratuit) ou `15 minutes` (recommandé)
   - **Alert Contacts** : Configurez votre email (optionnel, pour recevoir des alertes en cas d'erreur)

3. **Configuration avancée (optionnel) :**
   - **HTTP Method** : `POST` (ou `GET`, les deux fonctionnent)
   - **Keyword** : `"success"` (pour vérifier que la réponse contient "success" - cela confirme que le worker s'est exécuté correctement)

4. **Sauvegarder** et le monitor commencera à appeler votre endpoint automatiquement

5. **Vérifier que ça fonctionne :**
   - Attendez quelques minutes
   - Vérifiez les logs dans Vercel (Deployments > votre déploiement > Functions > `/api/worker`)
   - Vérifiez dans votre dashboard VIENOTIF que les "Recent Checks" apparaissent

**Avantages :**
- ✅ Gratuit jusqu'à 50 monitors
- ✅ Très fiable (99.9% uptime)
- ✅ Notifications en cas d'erreur
- ✅ Historique des appels
- ✅ Interface simple et intuitive
- ✅ Pas besoin de configuration complexe

**Note :** Si vous n'avez pas encore déployé sur Vercel, l'URL sera quelque chose comme `https://vienotif-xxx.vercel.app/api/worker`. Vous trouverez cette URL après le déploiement dans votre dashboard Vercel.

### Railway / Render

1. Connectez votre repo GitHub
2. Configurez les variables d'environnement
3. Configurez un cron externe pour appeler `GET /api/worker`

## 🗺️ Filtres disponibles

| Filtre | Description |
|--------|-------------|
| 🌍 Pays | Sélection multiple de pays |
| 📍 Villes | Recherche fuzzy par ville |
| 🗺️ Zones | Europe, Amérique, Asie, etc. |
| 📋 Type | VIE ou VIA |
| ⏱️ Durée | 6, 12, 18, 24 mois |
| 🏠 Télétravail | Oui/Non |
| 🏢 Entreprise | Recherche par nom |
| 🏭 Secteur | 18 secteurs d'activité |
| 🎓 Études | Bac à Bac+6 |
| 📊 Taille | TPE à Grande entreprise |
| 💶 Indemnité | Minimum/Maximum €/mois |
| 📅 Date début | Plage de dates |

## 🛠️ Stack technique

- **Frontend** : Next.js 16, React 19, Tailwind CSS
- **Backend** : Next.js API Routes, Supabase
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **Notifications** : Telegram Bot API, Discord Webhooks, Nodemailer
- **UI** : Radix UI, Lucide Icons

## 📝 Licence

MIT

---

Made with ❤️ for VIE/VIA job seekers
