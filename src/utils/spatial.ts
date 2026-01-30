import type { BBox } from '@/types';

/**
 * Spatial utility functions for bounding box operations
 */

/**
 * Parse bbox string from URL parameter
 * Format: "west,south,east,north"
 */
export function parseBbox(bboxString: string): BBox | null {
  if (!bboxString) return null;

  const parts = bboxString.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return null;
  }

  const [west, south, east, north] = parts;
  return { north, south, east, west };
}

/**
 * Create WKT POLYGON string from bbox for DuckDB spatial queries
 */
export function bboxToWkt(bbox: BBox): string {
  const { north, south, east, west } = bbox;
  return `POLYGON((${west} ${north}, ${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}))`;
}

/**
 * Format bbox for URL parameter
 */
export function formatBboxParam(bbox: BBox): string {
  return `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
}

/**
 * Check if bbox is valid
 */
export function isValidBbox(bbox: BBox | null): bbox is BBox {
  if (!bbox) return false;
  const { north, south, east, west } = bbox;
  return (
    !isNaN(north) &&
    !isNaN(south) &&
    !isNaN(east) &&
    !isNaN(west) &&
    north > south &&
    east > west &&
    north <= 90 &&
    south >= -90 &&
    east <= 180 &&
    west >= -180
  );
}
