import Fuse from "fuse.js";

export interface SearchableItem {
  value: string;
  label: string;
  [key: string]: unknown;
}

export function createFuzzySearch<T extends SearchableItem>(
  items: T[],
  keys: string[] = ["label"]
) {
  const fuse = new Fuse(items, {
    keys,
    threshold: 0.4, // 0 = exact, 1 = match anything
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: false,
  });

  return {
    search: (query: string): T[] => {
      if (!query || query.length < 2) {
        return items;
      }
      const results = fuse.search(query);
      return results.map((r) => r.item);
    },
  };
}

// Utility to normalize French accents for better matching
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Enhanced fuzzy search with accent normalization
export function fuzzyMatch(query: string, target: string): boolean {
  const normalizedQuery = normalizeText(query);
  const normalizedTarget = normalizeText(target);
  
  // Direct inclusion
  if (normalizedTarget.includes(normalizedQuery)) {
    return true;
  }
  
  // Simple fuzzy: check if all characters are in order
  let queryIdx = 0;
  for (const char of normalizedTarget) {
    if (char === normalizedQuery[queryIdx]) {
      queryIdx++;
    }
    if (queryIdx === normalizedQuery.length) {
      return true;
    }
  }
  
  return false;
}

