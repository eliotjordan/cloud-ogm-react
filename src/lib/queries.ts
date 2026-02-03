import type { SearchParams, FieldConfig } from '@/types';
import { parseBbox, bboxToWkt, isValidBbox } from '@/utils/spatial';
import { escapeSqlString } from '@/utils/format';
import { getPaginationSql } from '@/utils/pagination';
import { embeddingToSqlArray } from '@/utils/embeddings';
import {
  MAX_FACET_VALUES,
  DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD,
} from '@/lib/constants';
import { getFacetableFields, getCardFields } from '@/lib/fieldsConfig';

/**
 * Calculate similarity threshold for semantic search
 * Returns user-specified threshold or default
 *
 * @param _query - Search query text (unused, kept for API compatibility)
 * @param userThreshold - Optional user-specified threshold override
 * @returns Similarity threshold value between 0 and 1
 */
export function calculateSimilarityThreshold(
  _query: string,
  userThreshold?: number
): number {
  // If user specified a threshold, use it
  if (userThreshold !== undefined && userThreshold >= 0 && userThreshold <= 1) {
    return userThreshold;
  }

  // Use default threshold
  return DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD;
}

/**
 * Build WHERE clauses for facet filters
 * Dynamically handles all facetable fields from configuration
 * @param params - Search parameters containing filter values
 * @param excludeField - Optional field to exclude (used in facet queries)
 * @returns Array of SQL WHERE clause strings
 */
function buildFacetFilterClauses(params: SearchParams, excludeField?: string): string[] {
  const clauses: string[] = [];
  const facetableFields = getFacetableFields();

  facetableFields.forEach((fieldConfig) => {
    const field = fieldConfig.field;

    // Skip excluded field (used in facet queries to avoid filtering by own facet)
    if (field === excludeField) return;

    // Skip if no filter value provided
    if (!params[field]) return;

    const values = String(params[field]).split(',');
    const escapedValues = values.map((v) => `'${escapeSqlString(v)}'`);

    if (fieldConfig.isArray) {
      // Array fields use list_contains
      const conditions = escapedValues.map(
        (v) => `list_contains(${field}, ${v})`
      );
      clauses.push(`(${conditions.join(' OR ')})`);
    } else {
      // Scalar fields use IN
      clauses.push(`${field} IN (${escapedValues.join(', ')})`);
    }
  });

  return clauses;
}

/**
 * Get list of fields needed for search queries
 * Combines facetable fields, card display fields, and essential fields
 */
function getSearchFields(): string[] {
  const facetableFields = getFacetableFields().map(f => f.field);
  const cardFields = getCardFields().map(f => f.field);

  // Combine and deduplicate
  const allFields = new Set([
    'id',
    'geometry',
    'geojson',
    ...facetableFields,
    ...cardFields,
  ]);

  return Array.from(allFields);
}

/**
 * Build SQL query for searching metadata records
 */
export function buildSearchQuery(
  params: SearchParams,
  page: number,
  countOnly: boolean = false
): string {
  const whereClauses: string[] = [];

  // Check if we have a bbox for ratio calculation
  const bbox = params.bbox ? parseBbox(params.bbox) : null;
  const hasBbox = !!(bbox && isValidBbox(bbox));
  let polygon = '';
  if (hasBbox && bbox) {
    polygon = bboxToWkt(bbox);
  }

  // Text search
  if (params.q) {
    const escaped = escapeSqlString(params.q);
    whereClauses.push(
      `(title ILIKE '%${escaped}%' OR id ILIKE '%${escaped}%')`
    );
  }

  // Geographic filter
  if (hasBbox) {
    whereClauses.push(
      `ST_Intersects(geometry, '${polygon}'::GEOMETRY)`
    );
  }

  // Facet filters - dynamically built from field configuration
  const facetFilterClauses = buildFacetFilterClauses(params);
  whereClauses.push(...facetFilterClauses);

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  if (countOnly) {
    return `SELECT COUNT(*) FROM parquet_data ${whereClause}`;
  }

  // Build SELECT clause with specific fields
  const searchFields = getSearchFields();
  let selectClause = searchFields.join(', ');

  // Add ratio calculation if bbox exists
  if (hasBbox) {
    selectClause += `, ST_Area(geometry) / ST_Area(ST_Intersection(geometry, '${polygon}'::GEOMETRY)) as ratio`;
  }

  const { limit, offset } = getPaginationSql(page);
  return `
    SELECT ${selectClause}
    FROM parquet_data
    ${whereClause}
    ${hasBbox ? 'ORDER BY ratio ASC' : ''}
    LIMIT ${limit} OFFSET ${offset}
  `;
}

/**
 * Build SQL query for semantic search using embeddings
 * Uses cosine similarity to rank results by relevance
 */
export function buildSemanticSearchQuery(
  params: SearchParams,
  queryEmbedding: Float32Array,
  page: number,
  countOnly: boolean = false,
  userThreshold?: number
): string {
  const whereClauses: string[] = [];

  // Check if we have a bbox for ratio calculation
  const bbox = params.bbox ? parseBbox(params.bbox) : null;
  const hasBbox = !!(bbox && isValidBbox(bbox));
  let polygon = '';
  if (hasBbox && bbox) {
    polygon = bboxToWkt(bbox);
  }

  // Geographic filter
  if (hasBbox) {
    whereClauses.push(
      `ST_Intersects(geometry, '${polygon}'::GEOMETRY)`
    );
  }

  // Facet filters - dynamically built from field configuration
  const facetFilterClauses = buildFacetFilterClauses(params);
  whereClauses.push(...facetFilterClauses);

  // Filter out documents without embeddings
  whereClauses.push('embeddings IS NOT NULL');

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Convert query embedding to SQL array (needed for both count and results)
  const queryEmbeddingSql = embeddingToSqlArray(queryEmbedding);

  if (countOnly) {
    // For semantic search, count only documents above a similarity threshold
    // This gives a more accurate count of "relevant" results
    const similarityThreshold = calculateSimilarityThreshold(
      params.q || '',
      userThreshold
    );

    return `
      SELECT COUNT(*) FROM (
        SELECT list_dot_product(embeddings, ${queryEmbeddingSql}) as similarity
        FROM parquet_data
        ${whereClause}
      ) WHERE similarity >= ${similarityThreshold}
    `;
  }

  // Build SELECT clause with specific fields and similarity score
  const searchFields = getSearchFields();
  let selectClause = searchFields.join(', ');

  // Calculate cosine similarity using list_dot_product
  // Note: Embeddings in Parquet are already normalized
  selectClause += `, list_dot_product(embeddings, ${queryEmbeddingSql}) as similarity`;

  // Add ratio calculation if bbox exists
  if (hasBbox) {
    selectClause += `, ST_Area(geometry) / ST_Area(ST_Intersection(geometry, '${polygon}'::GEOMETRY)) as ratio`;
  }

  const { limit, offset } = getPaginationSql(page);

  // Similarity threshold to filter out irrelevant results
  const similarityThreshold = calculateSimilarityThreshold(
    params.q || '',
    userThreshold
  );

  // Order by similarity (descending), then by bbox ratio if applicable
  const orderBy = hasBbox
    ? 'ORDER BY similarity DESC, ratio ASC'
    : 'ORDER BY similarity DESC';

  // Use a subquery to filter by similarity threshold
  return `
    SELECT * FROM (
      SELECT ${selectClause}
      FROM parquet_data
      ${whereClause}
    ) subquery
    WHERE similarity >= ${similarityThreshold}
    ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `;
}

/**
 * Build SQL query for facet aggregation
 * Optionally filters by semantic similarity if queryEmbedding is provided
 */
export function buildFacetQuery(
  facetConfig: FieldConfig,
  params: SearchParams,
  queryEmbedding?: Float32Array,
  userThreshold?: number
): string {
  const whereClauses: string[] = [];

  // Apply same filters as main query (except the facet's own filter)
  // Only apply text search if not using semantic search
  if (params.q && !queryEmbedding) {
    const escaped = escapeSqlString(params.q);
    whereClauses.push(
      `(title ILIKE '%${escaped}%' OR id ILIKE '%${escaped}%')`
    );
  }

  // For semantic search, filter by similarity threshold
  const useSemanticFilter = queryEmbedding !== undefined;

  if (params.bbox) {
    const bbox = parseBbox(params.bbox);
    if (bbox && isValidBbox(bbox)) {
      const wkt = bboxToWkt(bbox);
      whereClauses.push(
        `ST_Intersects(geometry, '${wkt}'::GEOMETRY)`
      );
    }
  }

  // Apply other facet filters (but not this facet's own filter)
  const facetFilterClauses = buildFacetFilterClauses(params, facetConfig.field);
  whereClauses.push(...facetFilterClauses);

  // Add embeddings filter for semantic search
  if (useSemanticFilter) {
    whereClauses.push('embeddings IS NOT NULL');
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Build base table source
  let fromClause = 'parquet_data';

  // For semantic search, wrap in a subquery that filters by similarity
  if (useSemanticFilter && queryEmbedding) {
    const queryEmbeddingSql = embeddingToSqlArray(queryEmbedding);
    const similarityThreshold = calculateSimilarityThreshold(
      params.q || '',
      userThreshold
    );

    fromClause = `(
      SELECT *
      FROM parquet_data
      ${whereClause}
      AND list_dot_product(embeddings, ${queryEmbeddingSql}) >= ${similarityThreshold}
    ) as filtered_data`;

    // Clear whereClause since filters are now in the subquery
    // (except for the facet's own filter which we don't apply)
  }

  // Build aggregation query
  if (facetConfig.isArray) {
    // Array fields need UNNEST
    const finalWhere = useSemanticFilter ? '' : whereClause;
    // Filter out NULL and empty string values
    const blankFilter = finalWhere
      ? `${finalWhere} AND unnested_value IS NOT NULL AND unnested_value != ''`
      : `WHERE unnested_value IS NOT NULL AND unnested_value != ''`;

    return `
      SELECT unnested_value as value, COUNT(*) as count
      FROM ${fromClause}
      CROSS JOIN UNNEST(${facetConfig.field}) as t(unnested_value)
      ${blankFilter}
      GROUP BY unnested_value
      ORDER BY count DESC
      LIMIT ${MAX_FACET_VALUES}
    `;
  } else {
    // Scalar fields
    const finalWhere = useSemanticFilter ? '' : whereClause;
    // Filter out NULL and empty string values
    const blankFilter = finalWhere
      ? `${finalWhere} AND ${facetConfig.field} IS NOT NULL AND ${facetConfig.field} != ''`
      : `WHERE ${facetConfig.field} IS NOT NULL AND ${facetConfig.field} != ''`;

    return `
      SELECT ${facetConfig.field} as value, COUNT(*) as count
      FROM ${fromClause}
      ${blankFilter}
      GROUP BY ${facetConfig.field}
      ORDER BY count DESC, ${facetConfig.field} ASC
      LIMIT ${MAX_FACET_VALUES}
    `;
  }
}
