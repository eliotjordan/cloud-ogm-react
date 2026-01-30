/**
 * Application-wide constants
 */

export const PARQUET_URL =
  'https://pul-tile-images.s3.us-east-1.amazonaws.com/cloud.parquet';

export const PAGE_SIZE = 10;

export const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

export const DEBOUNCE_DELAY = 500;

export const MAX_FACET_VALUES = 30;

export const MAX_AUTOCOMPLETE_RESULTS = 10;

/**
 * Natural feature types to exclude from location search
 */
export const EXCLUDED_LOCATION_TYPES = [
  'river',
  'stream',
  'lake',
  'bay',
  'mountain',
  'peak',
  'island',
  'forest',
];

/**
 * Reference URL keys for different viewer types
 */
export const REFERENCE_KEYS = {
  IIIF_MANIFEST: 'http://iiif.io/api/presentation#manifest',
  WMS: 'http://www.opengis.net/def/serviceType/ogc/wms',
  COG: 'https://github.com/cogeotiff/cog-spec',
  PMTILES: 'https://github.com/protomaps/PMTiles',
  DOWNLOAD: 'http://schema.org/downloadUrl',
} as const;

/**
 * Map tile attribution
 */
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const OSM_TILE_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
