import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';

/**
 * Core geospatial metadata record from Parquet file
 */
export interface MetadataRecord {
  id: string;
  title: string;
  description?: string[];
  creator?: string[];
  location?: string[];
  publisher?: string[];
  provider: string;
  access_rights?: string;
  resource_class?: string[];
  resource_type?: string[];
  subject?: string[];
  theme?: string[];
  format?: string;
  temporal?: string[];
  index_year?: number[];
  modified?: string;
  identifier?: string[];
  thumbnail?: string;
  geojson?: string;
  geometry?: unknown; // WKB geometry
  references?: string; // JSON string
  wxs_identifier?: string;
}

/**
 * Parsed references from metadata record
 */
export interface ParsedReferences {
  iiifManifest?: string;
  wms?: string;
  cog?: string;
  pmtiles?: string;
  download?: string | DownloadLink[];
}

/**
 * Download link with label
 */
export interface DownloadLink {
  url: string;
  label: string;
}

/**
 * Field configuration for metadata
 */
export interface FieldConfig {
  field: keyof MetadataRecord;
  label: string;
  isArray: boolean;
  facetable: boolean;
  displayOnCard: boolean;
  displayOnItem: boolean;
}

/**
 * @deprecated Use FieldConfig instead
 * Facet configuration for search filters (legacy)
 */
export interface FacetConfig {
  field: keyof MetadataRecord;
  label: string;
  isArray: boolean;
}

/**
 * Facet value with count
 */
export interface FacetValue {
  value: string;
  count: number;
}

/**
 * Bounding box coordinates
 */
export interface BBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Search query parameters from URL
 */
export interface SearchParams {
  q?: string;
  bbox?: string;
  page?: number;
  [key: string]: string | number | undefined;
}

/**
 * Router route information
 */
export interface RouteInfo {
  path: string;
  route: 'home' | 'search' | 'item';
  params: string[];
  query: SearchParams;
}

/**
 * Nominatim place result from geocoding API
 */
export interface NominatimPlace {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  type: string;
  addresstype?: string;
  class: string;
}

/**
 * DuckDB context for queries
 */
export interface DuckDBContext {
  conn: AsyncDuckDBConnection | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  startResult: number;
  endResult: number;
}

/**
 * Resource class with icon and count
 */
export interface ResourceClassInfo {
  name: string;
  count: number;
  icon: string;
}
