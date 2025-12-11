"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2,
  MessageSquare,
  Mail,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  SubscriptionFilters,
  NotificationChannel,
  GEOGRAPHIC_ZONES,
  MISSION_DURATIONS,
  MISSION_TYPES,
  TELETRAVAIL_OPTIONS,
  ACTIVITY_SECTORS,
  STUDY_LEVELS,
  COMPANY_SIZES,
} from "@/lib/types";
import { COUNTRIES_LIST } from "@/lib/data";
import { useEffect } from "react";

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    label: string;
    filters: SubscriptionFilters;
    channel: NotificationChannel;
    target: string;
  }) => Promise<void>;
  initialData?: {
    label: string;
    filters: SubscriptionFilters;
    channel: NotificationChannel;
    target: string;
  };
  mode?: "create" | "edit";
}

export function SubscriptionForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [citiesList, setCitiesList] = useState<{ value: string; label: string; country: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Basic fields
  const [label, setLabel] = useState(initialData?.label || "");
  const [channel, setChannel] = useState<NotificationChannel>(
    initialData?.channel || "telegram"
  );
  const [target, setTarget] = useState(initialData?.target || "");
  const [query, setQuery] = useState(initialData?.filters?.query || "");

  // Location filters
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialData?.filters?.countriesIds || []
  );
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState(
    initialData?.filters?.citySearch || ""
  );

  // Charger les villes depuis l'API au montage du composant
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch("/api/cities");
        if (res.ok) {
          const cities = await res.json();
          setCitiesList(cities.map((city: any) => ({
            value: city.value || city.city_name || city.name,
            label: city.label || city.city_name_en || city.city_name || city.name,
            country: city.country || city.country_name || "",
          })));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des villes:", error);
      } finally {
        setLoadingCities(false);
      }
    };

    if (open) {
      loadCities();
    }
  }, [open]);
  const [selectedZones, setSelectedZones] = useState<string[]>(
    initialData?.filters?.geographicZones || []
  );

  // Mission filters
  const [selectedDurations, setSelectedDurations] = useState<string[]>(
    initialData?.filters?.missionsDurations || []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialData?.filters?.missionsTypesIds || []
  );
  const [teletravail, setTeletravail] = useState<string[]>(
    initialData?.filters?.teletravail || []
  );

  // Company filters
  const [companySearch, setCompanySearch] = useState(
    initialData?.filters?.companySearch || ""
  );
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    initialData?.filters?.activitySectorId || []
  );
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>(
    initialData?.filters?.companiesSizes || []
  );

  // Study level
  const [selectedStudyLevels, setSelectedStudyLevels] = useState<string[]>(
    initialData?.filters?.studiesLevelId || []
  );

  // Compensation filters
  const [minIndemnite, setMinIndemnite] = useState<string>(
    initialData?.filters?.minIndemnite?.toString() || ""
  );
  const [maxIndemnite, setMaxIndemnite] = useState<string>(
    initialData?.filters?.maxIndemnite?.toString() || ""
  );

  // Date filters
  const [startDateAfter, setStartDateAfter] = useState(
    initialData?.filters?.startDateAfter || ""
  );
  const [startDateBefore, setStartDateBefore] = useState(
    initialData?.filters?.startDateBefore || ""
  );

  // Build city search from selected cities
  const buildCitySearch = (): string => {
    if (selectedCities.length > 0) {
      const cityLabels = selectedCities
        .map((v) => CITIES_LIST.find((c) => c.value === v)?.label.replace(/^..\s/, ""))
        .filter(Boolean);
      return cityLabels.join("|");
    }
    return citySearch;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        label,
        filters: {
          countriesIds: selectedCountries.length > 0 ? selectedCountries : undefined,
          geographicZones: selectedZones.length > 0 ? selectedZones : undefined,
          missionsDurations: selectedDurations.length > 0 ? selectedDurations : undefined,
          missionsTypesIds: selectedTypes.length > 0 ? selectedTypes : undefined,
          teletravail: teletravail.length > 0 ? teletravail : undefined,
          activitySectorId: selectedSectors.length > 0 ? selectedSectors : undefined,
          studiesLevelId: selectedStudyLevels.length > 0 ? selectedStudyLevels : undefined,
          companiesSizes: selectedCompanySizes.length > 0 ? selectedCompanySizes : undefined,
          query: query || undefined,
          citySearch: buildCitySearch() || undefined,
          companySearch: companySearch || undefined,
          minIndemnite: minIndemnite ? parseFloat(minIndemnite) : undefined,
          maxIndemnite: maxIndemnite ? parseFloat(maxIndemnite) : undefined,
          startDateAfter: startDateAfter || undefined,
          startDateBefore: startDateBefore || undefined,
        },
        channel,
        target,
      });
      onOpenChange(false);
      if (mode === "create") {
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLabel("");
    setChannel("telegram");
    setTarget("");
    setQuery("");
    setSelectedCountries([]);
    setSelectedCities([]);
    setCitySearch("");
    setSelectedZones([]);
    setSelectedDurations([]);
    setSelectedTypes([]);
    setTeletravail([]);
    setCompanySearch("");
    setSelectedSectors([]);
    setSelectedCompanySizes([]);
    setSelectedStudyLevels([]);
    setMinIndemnite("");
    setMaxIndemnite("");
    setStartDateAfter("");
    setStartDateBefore("");
  };

  const toggleSelection = (
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  // Convert sectors to combobox format
  const sectorOptions = Object.entries(ACTIVITY_SECTORS).map(([value, label]) => ({
    value,
    label,
  }));

  // Convert study levels to combobox format
  const studyOptions = Object.entries(STUDY_LEVELS).map(([value, label]) => ({
    value,
    label: `🎓 ${label}`,
  }));

  // Convert company sizes to combobox format
  const companySizeOptions = Object.entries(COMPANY_SIZES).map(([value, label]) => ({
    value,
    label: `🏢 ${label}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Nouvelle souscription" : "Modifier"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configurez les filtres et les notifications
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="label" className="text-sm font-medium">
              Nom de la souscription *
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Jobs Tech à New York"
              required
              className="h-11"
            />
          </div>

          {/* Keyword Search */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">🔍 Mots-clés</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: engineer, marketing, finance..."
              className="h-11"
            />
          </div>

          {/* Countries - Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">🌍 Pays</Label>
            <Combobox
              options={COUNTRIES_LIST}
              selected={selectedCountries}
              onChange={setSelectedCountries}
              placeholder="Sélectionner des pays..."
              searchPlaceholder="Rechercher un pays..."
              emptyText="Aucun pays trouvé"
            />
          </div>

          {/* Cities - Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">📍 Villes</Label>
            {loadingCities ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des villes...
              </div>
            ) : (
              <Combobox
                options={citiesList}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder="Sélectionner des villes..."
                searchPlaceholder="Rechercher une ville (ex: Palm Beach, Paris, New York)..."
                emptyText="Aucune ville trouvée"
                allowCustom={true}
              />
            )}
            <p className="text-xs text-slate-500">
              {citiesList.length > 0 
                ? `${citiesList.length} villes disponibles. Vous pouvez aussi taper une ville manuellement.`
                : "Tapez une ville manuellement ou synchronisez les villes depuis l'API."}
            </p>
            <Input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Ex: Palm Beach, Salt Lake City, Nice..."
              className="h-10"
            />
          </div>

          {/* Geographic Zones - Compact */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">🗺️ Zones géographiques</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(GEOGRAPHIC_ZONES).map(([id, name]) => (
                <Badge
                  key={id}
                  variant={selectedZones.includes(id) ? "default" : "outline"}
                  className="cursor-pointer text-xs py-1 px-2 hover:bg-indigo-600/40 transition-colors"
                  onClick={() => toggleSelection(id, selectedZones, setSelectedZones)}
                >
                  {name}
                  {selectedZones.includes(id) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Mission Type - Compact */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">📋 Type de mission</Label>
            <div className="flex gap-2">
              {Object.entries(MISSION_TYPES).map(([id, name]) => (
                <Badge
                  key={id}
                  variant={selectedTypes.includes(id) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3 hover:bg-indigo-600/40 transition-colors"
                  onClick={() => toggleSelection(id, selectedTypes, setSelectedTypes)}
                >
                  {name}
                  {selectedTypes.includes(id) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Duration - Compact */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">⏱️ Durée</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MISSION_DURATIONS).map(([id, name]) => (
                <Badge
                  key={id}
                  variant={selectedDurations.includes(id) ? "default" : "outline"}
                  className="cursor-pointer text-xs py-1 px-2 hover:bg-indigo-600/40 transition-colors"
                  onClick={() => toggleSelection(id, selectedDurations, setSelectedDurations)}
                >
                  {name}
                  {selectedDurations.includes(id) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Remote Work - Compact */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">🏠 Télétravail</Label>
            <div className="flex gap-2">
              {Object.entries(TELETRAVAIL_OPTIONS).map(([id, name]) => (
                <Badge
                  key={id}
                  variant={teletravail.includes(id) ? "default" : "outline"}
                  className="cursor-pointer text-xs py-1.5 px-2 hover:bg-indigo-600/40 transition-colors"
                  onClick={() => toggleSelection(id, teletravail, setTeletravail)}
                >
                  {id === "1" ? "🏠 Oui" : "🏢 Non"}
                  {teletravail.includes(id) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            type="button"
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>⚙️ Filtres avancés</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-3 border border-slate-700 rounded-lg bg-slate-800/20">
              {/* Company Search */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">🏢 Entreprise</Label>
                <Input
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Ex: Google, Total, BNP..."
                  className="h-10"
                />
              </div>

              {/* Activity Sector - Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">🏭 Secteur d'activité</Label>
                <Combobox
                  options={sectorOptions}
                  selected={selectedSectors}
                  onChange={setSelectedSectors}
                  placeholder="Sélectionner des secteurs..."
                  searchPlaceholder="Rechercher..."
                  emptyText="Aucun secteur trouvé"
                />
              </div>

              {/* Study Level - Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">🎓 Niveau d'études</Label>
                <Combobox
                  options={studyOptions}
                  selected={selectedStudyLevels}
                  onChange={setSelectedStudyLevels}
                  placeholder="Sélectionner des niveaux..."
                  searchPlaceholder="Rechercher..."
                  emptyText="Aucun niveau trouvé"
                />
              </div>

              {/* Company Size - Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">📊 Taille d'entreprise</Label>
                <Combobox
                  options={companySizeOptions}
                  selected={selectedCompanySizes}
                  onChange={setSelectedCompanySizes}
                  placeholder="Sélectionner des tailles..."
                  searchPlaceholder="Rechercher..."
                  emptyText="Aucune taille trouvée"
                />
              </div>

              {/* Indemnité Range */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">💶 Indemnité (€/mois)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={minIndemnite}
                    onChange={(e) => setMinIndemnite(e.target.value)}
                    placeholder="Min"
                    min="0"
                    className="h-10"
                  />
                  <Input
                    type="number"
                    value={maxIndemnite}
                    onChange={(e) => setMaxIndemnite(e.target.value)}
                    placeholder="Max"
                    min="0"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Start Date Range */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">📅 Date de début</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={startDateAfter}
                      onChange={(e) => setStartDateAfter(e.target.value)}
                      className="h-10"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">Après</p>
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={startDateBefore}
                      onChange={(e) => setStartDateBefore(e.target.value)}
                      className="h-10"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">Avant</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-700" />

          {/* Notification Channel */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">📬 Canal de notification</Label>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as NotificationChannel)}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="telegram">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    Telegram
                  </div>
                </SelectItem>
                <SelectItem value="discord">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-violet-400" />
                    Discord
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    Email
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target */}
          <div className="space-y-1.5">
            <Label htmlFor="target" className="text-sm font-medium">
              {channel === "telegram"
                ? "Chat ID Telegram"
                : channel === "discord"
                ? "URL Webhook Discord"
                : "Adresse email"}
            </Label>
            <Input
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={
                channel === "telegram"
                  ? "Ex: 123456789"
                  : channel === "discord"
                  ? "Ex: https://discord.com/api/webhooks/..."
                  : "Ex: vous@email.com"
              }
              required
              className="h-11"
            />
            {channel === "telegram" && (
              <p className="text-xs text-slate-500">
                Obtenez votre ID via @userinfobot sur Telegram
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Créer" : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
