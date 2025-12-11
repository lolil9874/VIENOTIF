"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { normalizeText } from "@/lib/fuzzy-search";

interface Option {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCustom?: boolean;
}

export function Combobox({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat.",
  allowCustom = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  // Improved fuzzy filter with accent normalization and scoring
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) {
      return options;
    }
    
    const normalizedQuery = normalizeText(searchQuery).toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    
    return options
      .map((option) => {
        const normalizedLabel = normalizeText(option.label).toLowerCase();
        const normalizedValue = normalizeText(option.value).toLowerCase();
        const country = (option as any).country ? normalizeText((option as any).country).toLowerCase() : "";
        
        // Score de correspondance
        let score = 0;
        
        // Correspondance exacte
        if (normalizedLabel === normalizedQuery || normalizedValue === normalizedQuery) {
          score = 100;
        }
        // Commence par la requête
        else if (normalizedLabel.startsWith(normalizedQuery) || normalizedValue.startsWith(normalizedQuery)) {
          score = 80;
        }
        // Contient tous les mots
        else if (queryWords.every(word => normalizedLabel.includes(word) || normalizedValue.includes(word))) {
          score = 60;
        }
        // Contient au moins un mot
        else if (queryWords.some(word => normalizedLabel.includes(word) || normalizedValue.includes(word) || country.includes(word))) {
          score = 40;
        }
        
        return { option, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ option }) => option);
  }, [options, searchQuery]);

  // Get labels for selected values
  const getLabel = (value: string) => {
    const option = options.find((o) => o.value === value);
    return option ? option.label : value;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[44px] h-auto"
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selected.length > 0 ? (
              selected.length <= 3 ? (
                selected.map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1 mb-1 text-xs"
                  >
                    {getLabel(value)}
                    <button
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
                ))
              ) : (
                <span className="text-sm">
                  {selected.length} sélectionné(s)
                </span>
              )
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {emptyText}
              {allowCustom && searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => {
                    handleSelect(searchQuery);
                    setSearchQuery("");
                  }}
                >
                  Ajouter "{searchQuery}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                  {(option as any).country && (
                    <span className="ml-2 text-xs text-slate-500 truncate">
                      {(option as any).country}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
