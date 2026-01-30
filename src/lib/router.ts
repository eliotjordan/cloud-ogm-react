import type { RouteInfo, SearchParams } from '@/types';

/**
 * Hash-based router for client-side navigation
 * Parses window.location.hash into route information
 */

/**
 * Parse the current hash into route information
 */
export function parseHash(): RouteInfo {
  const hash = window.location.hash.slice(1) || '/';

  // Split path and query string
  const [pathPart, queryPart] = hash.split('?');
  const parts = pathPart.split('/').filter(Boolean);

  // Parse query parameters
  const query: SearchParams = {};
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    params.forEach((value, key) => {
      // Convert page to number, keep others as strings
      query[key] = key === 'page' ? parseInt(value, 10) : value;
    });
  }

  // Determine route type
  let route: RouteInfo['route'] = 'home';
  if (parts[0] === 'search') {
    route = 'search';
  } else if (parts[0] === 'item') {
    route = 'item';
  }

  return {
    path: hash,
    route,
    params: parts.slice(1),
    query,
  };
}

/**
 * Navigate to a new path
 */
export function navigate(path: string): void {
  window.location.hash = path;
}

/**
 * Build a search URL with query parameters
 */
export function buildSearchUrl(params: SearchParams): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `#/search?${queryString}` : '#/search';
}

/**
 * Update current URL with new search parameters
 */
export function updateSearchParams(newParams: Partial<SearchParams>): void {
  const current = parseHash();
  const updated: SearchParams = { ...current.query, ...newParams };

  // Remove undefined/null values
  Object.keys(updated).forEach((key) => {
    const typedKey = key as keyof SearchParams;
    if (updated[typedKey] === undefined || updated[typedKey] === null) {
      delete updated[typedKey];
    }
  });

  const url = buildSearchUrl(updated);
  window.location.hash = url;
}

/**
 * Add or remove a filter value
 */
export function toggleFilter(
  field: string,
  value: string,
  isActive: boolean
): void {
  const current = parseHash();
  const currentValues = current.query[field]
    ? String(current.query[field]).split(',')
    : [];

  let newValues: string[];
  if (isActive) {
    // Remove value
    newValues = currentValues.filter((v) => v !== value);
  } else {
    // Add value
    newValues = [...currentValues, value];
  }

  const updated: SearchParams = { ...current.query, page: 1 }; // Reset to page 1

  if (newValues.length > 0) {
    updated[field as keyof SearchParams] = newValues.join(',') as any;
  } else {
    delete updated[field as keyof SearchParams];
  }

  const url = buildSearchUrl(updated);
  window.location.hash = url;
}

/**
 * Clear all filters but keep query and bbox
 */
export function clearFilters(): void {
  const current = parseHash();
  const { q, bbox } = current.query;

  const cleaned: SearchParams = {};
  if (q) cleaned.q = q;
  if (bbox) cleaned.bbox = bbox;

  const url = buildSearchUrl(cleaned);
  window.location.hash = url;
}
