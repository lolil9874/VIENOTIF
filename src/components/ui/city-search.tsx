"use client";

import * as React from "react";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { normalizeText } from "@/lib/fuzzy-search";

interface City {
  value: string;
  label: string;
  country?: string;
}

interface CitySearchProps {
  cities: City[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  loading?: boolean;
}

export function CitySearch({
  cities,
  selected,
  onChange,
  placeholder = "Rechercher une ville (ex: Palm Beach, Paris, New York)...",
  loading = false,
}: CitySearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter cities based on search query with scoring
  const filteredCities = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return cities.slice(0, 20); // Show top 20 when no search
    }

    const normalizedQuery = normalizeText(searchQuery).toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    
    return cities
      .map((city) => {
        const normalizedLabel = normalizeText(city.label).toLowerCase();
        const normalizedValue = normalizeText(city.value).toLowerCase();
        const country = city.country ? normalizeText(city.country).toLowerCase() : "";
        
        let score = 0;
        
        // Exact match
        if (normalizedLabel === normalizedQuery || normalizedValue === normalizedQuery) {
          score = 100;
        }
        // Starts with
        else if (normalizedLabel.startsWith(normalizedQuery) || normalizedValue.startsWith(normalizedQuery)) {
          score = 80;
        }
        // Contains all words
        else if (queryWords.every(word => normalizedLabel.includes(word) || normalizedValue.includes(word))) {
          score = 60;
        }
        // Contains at least one word
        else if (queryWords.some(word => normalizedLabel.includes(word) || normalizedValue.includes(word) || country.includes(word))) {
          score = 40;
        }
        
        return { city, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Limit to top 10 results
      .map(({ city }) => city);
  }, [cities, searchQuery]);

  const handleSelect = (city: City) => {
    if (!selected.includes(city.value)) {
      onChange([...selected, city.value]);
    }
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const getCityLabel = (value: string) => {
    const city = cities.find((c) => c.value === value);
    return city ? city.label : value;
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
      {/* Input with selected cities as badges */}
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 items-center min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {selected.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="text-xs"
                >
                  {getCityLabel(value)}
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
            placeholder={selected.length === 0 ? placeholder : "Ajouter une autre ville..."}
            className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
          />
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          )}
        </div>
      </div>

      {/* Dropdown with suggestions */}
      {isOpen && searchQuery.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
          {filteredCities.length > 0 ? (
            <div className="p-1">
              {filteredCities.map((city) => {
                const isSelected = selected.includes(city.value);
                return (
                  <div
                    key={city.value}
                    onClick={() => handleSelect(city)}
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
                    <span className="flex-1">{city.label}</span>
                    {city.country && (
                      <span className="text-xs text-slate-500 ml-2">
                        {city.country}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              Aucune ville trouvée. Vous pouvez taper la ville manuellement.
            </div>
          )}
        </div>
      )}

      {/* Show recent/popular cities when no search */}
      {isOpen && !searchQuery.trim() && cities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
          <div className="p-2 text-xs text-slate-500 font-medium">
            Villes populaires
          </div>
          <div className="p-1">
            {cities.slice(0, 10).map((city) => {
              const isSelected = selected.includes(city.value);
              return (
                <div
                  key={city.value}
                  onClick={() => handleSelect(city)}
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
                  <span className="flex-1">{city.label}</span>
                  {city.country && (
                    <span className="text-xs text-slate-500 ml-2">
                      {city.country}
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

