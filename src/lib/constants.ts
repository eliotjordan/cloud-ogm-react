/**
 * Application-wide constants
 */

export const PARQUET_URL =
  'https://pul-tile-images.s3.us-east-1.amazonaws.com/cloud.parquet';

export const PAGE_SIZE = 10;

export const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

export const DEBOUNCE_DELAY = 250;

export const MAX_FACET_VALUES = 20;

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
  IIIF_IMAGE: 'http://iiif.io/api/image',
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

/**
 * Default embedding model configuration
 * Model files stored in S3 for client-side semantic search
 */
export const DEFAULT_MODEL_CONFIG = {
  tokenizerUrl: 'https://pul-tile-images.s3.us-east-1.amazonaws.com/tokenizer.json',
  embeddingsUrl: 'https://pul-tile-images.s3.us-east-1.amazonaws.com/embeddings.bin',
  embeddingDim: 128, // Default dimension, should match model
};

/**
 * Default minimum cosine similarity threshold for semantic search results
 * Results below this threshold are considered irrelevant
 * Range: 0.0 (no similarity) to 1.0 (identical)
 * Typical threshold: 0.3-0.5 for general relevance
 */
export const DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD = 0.5;

/**
 * Similarity threshold for short queries (< 10 characters)
 * Shorter queries are often vague, so use stricter threshold
 */
export const SHORT_QUERY_SIMILARITY_THRESHOLD = 0.4;

/**
 * Query length threshold for determining short vs normal queries
 */
export const SHORT_QUERY_LENGTH = 10;
