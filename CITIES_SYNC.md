# 🌍 Système de Synchronisation des Villes

## ✅ Fonctionnalités

### 1. Synchronisation automatique
- **À chaque connexion** : Les villes sont automatiquement synchronisées depuis l'API VIE
- **Mise à jour intelligente** : Seules les nouvelles villes sont ajoutées, les existantes sont mises à jour
- **Stockage dans Supabase** : Toutes les villes sont stockées dans la table `cached_cities`

### 2. Récupération complète
- **Toutes les villes** : Le système récupère TOUTES les villes depuis l'API (jusqu'à 10 000 offres)
- **Inclut toutes les villes** : Palm Beach, Salt Lake City, Nice, Paris, etc.
- **Informations complètes** : Nom français, nom anglais, pays, nombre d'offres

### 3. Interface améliorée
- **Recherche intelligente** : Système de scoring pour trouver les meilleures correspondances
- **Affichage du pays** : Le pays s'affiche à côté de chaque ville
- **Saisie manuelle** : Possibilité de taper une ville manuellement si elle n'est pas dans la liste
- **Chargement dynamique** : Les villes se chargent depuis la base de données

## 🔧 Architecture

### API Routes

#### `GET /api/cities`
Récupère toutes les villes depuis la base de données Supabase.

**Réponse** :
```json
[
  {
    "value": "Palm Beach",
    "label": "Palm Beach",
    "country": "United States",
    "count": 5,
    "city_name": "Palm Beach",
    "city_name_en": "Palm Beach",
    "country_id": "US",
    "country_name": "United States"
  }
]
```

#### `POST /api/cities/sync`
Synchronise toutes les villes depuis l'API VIE.

**Processus** :
1. Récupère toutes les offres depuis l'API VIE (par lots de 1000)
2. Extrait toutes les villes uniques avec leurs pays
3. Insère les nouvelles villes dans `cached_cities`
4. Met à jour les villes existantes (nombre d'offres, etc.)

**Réponse** :
```json
{
  "success": true,
  "total_offers": 5234,
  "unique_cities": 1247,
  "inserted": 23,
  "updated": 1224,
  "message": "Synchronisation réussie : 23 nouvelles villes, 1224 mises à jour"
}
```

### Base de données

**Table `cached_cities`** :
- `id` (UUID) - Identifiant unique
- `city_name` (TEXT) - Nom de la ville (français)
- `city_name_en` (TEXT) - Nom de la ville (anglais)
- `country_id` (TEXT) - Code pays
- `country_name` (TEXT) - Nom du pays
- `offer_count` (INTEGER) - Nombre d'offres dans cette ville
- `last_seen_at` (TIMESTAMPTZ) - Dernière fois que la ville a été vue

## 🚀 Utilisation

### Synchronisation automatique
La synchronisation se fait automatiquement à chaque connexion d'un utilisateur.

### Synchronisation manuelle
Vous pouvez aussi déclencher une synchronisation manuelle :

```bash
curl -X POST https://votre-app.vercel.app/api/cities/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Dans le formulaire
1. Ouvrez le formulaire de création/édition de souscription
2. Les villes se chargent automatiquement depuis la base de données
3. Recherchez une ville (ex: "Palm Beach", "Paris", "New York")
4. Sélectionnez les villes souhaitées
5. Ou tapez une ville manuellement si elle n'est pas dans la liste

## 🔍 Recherche améliorée

Le système de recherche utilise un scoring intelligent :

1. **Correspondance exacte** (score 100) : La ville correspond exactement
2. **Commence par** (score 80) : La ville commence par la recherche
3. **Contient tous les mots** (score 60) : Tous les mots de la recherche sont présents
4. **Contient au moins un mot** (score 40) : Au moins un mot correspond

Les résultats sont triés par score décroissant.

## 📊 Statistiques

- **Villes synchronisées** : Toutes les villes présentes dans les offres VIE/VIA
- **Mise à jour** : Automatique à chaque connexion
- **Performance** : Recherche rapide grâce à l'indexation dans Supabase

## ✅ Avantages

1. **Toujours à jour** : Les villes sont synchronisées automatiquement
2. **Complet** : Toutes les villes sont disponibles (Palm Beach, etc.)
3. **Rapide** : Recherche dans la base de données locale
4. **Intelligent** : Mise à jour uniquement des villes modifiées
5. **Fiable** : Pas d'erreur de ville manquante

