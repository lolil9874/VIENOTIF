"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { normalizeText } from "@/lib/fuzzy-search";

interface Country {
  value: string; // country_id (ex: "US")
  label: string; // country_name (ex: "United States" ou "États-Unis")
  count?: number; // nombre de villes/offres
}

interface CountrySearchProps {
  countries: Country[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  loading?: boolean;
}

export function CountrySearch({
  countries,
  selected,
  onChange,
  placeholder = "Rechercher un pays (ex: USA, États-Unis, United States)...",
  loading = false,
}: CountrySearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter countries based on search query with scoring
  const filteredCountries = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return countries.slice(0, 20); // Show top 20 when no search
    }

    const normalizedQuery = normalizeText(searchQuery);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    
    return countries
      .map((country) => {
        const normalizedLabel = normalizeText(country.label);
        const normalizedValue = normalizeText(country.value);
        
        let score = 0;
        
        // Exact match (case-insensitive, accent-insensitive)
        if (normalizedLabel === normalizedQuery || normalizedValue === normalizedQuery) {
          score = 100;
        }
        // Starts with
        else if (normalizedLabel.startsWith(normalizedQuery) || normalizedValue.startsWith(normalizedQuery)) {
          score = 80;
        }
        // Contains all words
        else if (queryWords.length > 0 && queryWords.every(word => 
          normalizedLabel.includes(word) || 
          normalizedValue.includes(word) ||
          country.label.toLowerCase().includes(word) ||
          country.value.toLowerCase().includes(word)
        )) {
          score = 60;
        }
        // Contains at least one word
        else if (queryWords.some(word => 
          normalizedLabel.includes(word) || 
          normalizedValue.includes(word) ||
          country.label.toLowerCase().includes(word) ||
          country.value.toLowerCase().includes(word)
        )) {
          score = 40;
        }
        // Partial match (contains query as substring anywhere)
        else if (
          normalizedLabel.includes(normalizedQuery) || 
          normalizedValue.includes(normalizedQuery) ||
          country.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.value.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          score = 30;
        }
        
        return { country, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        // First sort by score
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Then by label length (shorter first)
        return a.country.label.length - b.country.label.length;
      })
      .slice(0, 10) // Limit to top 10 results
      .map(({ country }) => country);
  }, [countries, searchQuery]);

  const handleSelect = (country: Country) => {
    if (!selected.includes(country.value)) {
      onChange([...selected, country.value]);
    }
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const getCountryLabel = (value: string) => {
    const country = countries.find((c) => c.value === value);
    return country ? country.label : value;
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input with selected countries as badges */}
      <div className="relative">
        <div className={`flex flex-wrap gap-1.5 items-center min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${loading ? 'opacity-60 cursor-wait' : ''}`}>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {selected.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="text-xs"
                >
                  {getCountryLabel(value)}
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(value, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={selected.length === 0 ? placeholder : "Ajouter un autre pays..."}
            className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
            disabled={loading && countries.length === 0}
            readOnly={loading && countries.length === 0}
          />
        </div>
      </div>

      {/* Dropdown with suggestions */}
      {isOpen && searchQuery.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
          {filteredCountries.length > 0 ? (
            <div className="p-1">
              {filteredCountries.map((country) => {
                const isSelected = selected.includes(country.value);
                return (
                  <div
                    key={country.value}
                    onClick={() => handleSelect(country)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{country.label}</span>
                    {country.count !== undefined && (
                      <span className="text-xs text-slate-500 ml-2">
                        ({country.count} villes)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              {countries.length === 0 
                ? "Aucun pays chargé. Vérifiez que la synchronisation a été effectuée."
                : `Aucun pays trouvé pour "${searchQuery}". Vous pouvez taper le code pays (ex: US, FR, GB).`}
            </div>
          )}
        </div>
      )}

      {/* Show popular countries when no search */}
      {isOpen && !searchQuery.trim() && countries.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
          <div className="p-2 text-xs text-slate-500 font-medium">
            Pays disponibles
          </div>
          <div className="p-1">
            {countries.slice(0, 10).map((country) => {
              const isSelected = selected.includes(country.value);
              return (
                <div
                  key={country.value}
                  onClick={() => handleSelect(country)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{country.label}</span>
                  {country.count !== undefined && (
                    <span className="text-xs text-slate-500 ml-2">
                      ({country.count} villes)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

