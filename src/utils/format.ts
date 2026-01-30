/**
 * Utility functions for formatting and displaying data
 */

/**
 * Format a value for display (handles arrays, nulls, objects)
 */
export function formatValue(
  value: unknown,
  isArray: boolean = false
): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Handle Apache Arrow vectors from DuckDB
  if (
    typeof value === 'object' &&
    value !== null &&
    'toArray' in value &&
    typeof value.toArray === 'function'
  ) {
    try {
      value = (value as { toArray: () => unknown[] }).toArray();
    } catch (error) {
      console.error('Error converting Arrow Vector:', error);
    }
  }

  // Parse JSON string arrays
  if (isArray && typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      value = JSON.parse(value);
    } catch {
      // Continue with string value if parsing fails
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'N/A';
    }
    const stringValues = value
      .filter((v) => v !== null && v !== undefined)
      .map((v) => {
        if (typeof v === 'string') return v;
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      });
    return stringValues.length > 0 ? stringValues.join(', ') : 'N/A';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Format numbers with thousands separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Escape single quotes for SQL queries
 */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Get thumbnail placeholder based on resource class
 */
export function getThumbnailPlaceholder(
  resourceClass?: string | string[]
): string {
  const firstClass = Array.isArray(resourceClass)
    ? resourceClass[0]
    : resourceClass;

  switch (firstClass) {
    case 'Maps':
      return '/map-placeholder.svg';
    case 'Datasets':
      return '/dataset-placeholder.svg';
    case 'Imagery':
      return '/imagery-placeholder.svg';
    case 'Web Services':
      return '/service-placeholder.svg';
    case 'Collections':
      return '/collection-placeholder.svg';
    default:
      return '/globe-placeholder.svg';
  }
}
