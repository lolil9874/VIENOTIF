// VIE API Response types
export interface VIEOffer {
  id: number;
  reference: string;
  missionTitle: string;
  organizationName: string;
  cityName: string;
  cityNameEn: string;
  countryName: string;
  countryNameEn: string;
  missionStartDate: string;
  missionDuration: number;
  missionType: string;
  teleworkingAvailable: boolean;
  indemnite: number;
  contactURL: string;
  missionDescription: string;
  activitySectorId: number;
  studyLevelId: number;
  companySize: string;
}

export interface VIEAPIResponse {
  result: VIEOffer[];
  totalCount: number;
}

export interface VIESearchFilters {
  limit?: number;
  skip?: number;
  query?: string | null;
  geographicZones?: string[];
  countriesIds?: string[];
  teletravail?: string[];
  porteEnv?: string[];
  activitySectorId?: string[];
  missionsTypesIds?: string[];
  missionsDurations?: string[];
  studiesLevelId?: string[];
  companiesSizes?: string[];
  specializationsIds?: string[];
  entreprisesIds?: number[];
  missionStartDate?: string | null;
}

export type NotificationChannel = "telegram" | "email" | "discord";

export interface SubscriptionFilters {
  countriesIds?: string[];
  geographicZones?: string[];
  missionsDurations?: string[];
  teletravail?: string[];
  missionsTypesIds?: string[];
  activitySectorId?: string[];
  studiesLevelId?: string[];
  companiesSizes?: string[];
  query?: string;
  // Post-processing filters
  cities?: string[];
  citySearch?: string;
  companyName?: string;
  companySearch?: string;
  minIndemnite?: number;
  maxIndemnite?: number;
  startDateAfter?: string;
  startDateBefore?: string;
  missionStartDateAfter?: string;
  missionStartDateBefore?: string;
}

export interface SubscriptionFormData {
  label: string;
  filters: SubscriptionFilters;
  channel: NotificationChannel;
  target: string;
}

export interface NotificationPayload {
  offer: VIEOffer;
  subscriptionLabel: string;
}

// Filter options constants
export const GEOGRAPHIC_ZONES: Record<string, string> = {
  "1": "Europe",
  "2": "Amérique du Nord",
  "3": "Amérique Latine",
  "4": "Asie",
  "5": "Moyen-Orient",
  "6": "Afrique",
  "7": "Océanie",
};

export const MISSION_DURATIONS: Record<string, string> = {
  "6": "6 mois",
  "12": "12 mois",
  "18": "18 mois",
  "24": "24 mois",
};

export const MISSION_TYPES: Record<string, string> = {
  "1": "VIE",
  "2": "VIA",
};

export const TELETRAVAIL_OPTIONS: Record<string, string> = {
  "1": "Oui",
  "0": "Non",
};

export const ACTIVITY_SECTORS: Record<string, string> = {
  "1": "Aéronautique / Spatial / Défense",
  "2": "Agriculture / Agroalimentaire",
  "3": "Automobile / Transport",
  "4": "Banque / Assurance / Finance",
  "5": "BTP / Construction",
  "6": "Chimie / Pharmacie / Biotechnologies",
  "7": "Commerce / Distribution",
  "8": "Communication / Marketing / Publicité",
  "9": "Conseil / Audit",
  "10": "Énergie / Environnement",
  "11": "Hôtellerie / Restauration / Tourisme",
  "12": "Industrie / Production",
  "13": "Informatique / Télécommunications",
  "14": "Luxe / Mode / Cosmétiques",
  "15": "Médias / Édition / Culture",
  "16": "Santé / Social",
  "17": "Services aux entreprises",
  "18": "Transport / Logistique",
};

export const STUDY_LEVELS: Record<string, string> = {
  "1": "Bac",
  "2": "Bac +2",
  "3": "Bac +3 / Licence",
  "4": "Bac +4",
  "5": "Bac +5 / Master",
  "6": "Bac +6 et plus / Doctorat",
};

export const COMPANY_SIZES: Record<string, string> = {
  "1": "TPE (< 10 salariés)",
  "2": "PME (10-249 salariés)",
  "3": "ETI (250-4999 salariés)",
  "4": "Grande entreprise (5000+ salariés)",
};
