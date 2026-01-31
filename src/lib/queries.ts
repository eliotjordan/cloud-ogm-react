import type { SearchParams, FieldConfig } from '@/types';
import { parseBbox, bboxToWkt, isValidBbox } from '@/utils/spatial';
import { escapeSqlString } from '@/utils/format';
import { getPaginationSql } from '@/utils/pagination';
import { MAX_FACET_VALUES } from '@/lib/constants';
import { getFacetableFields, getCardFields } from '@/lib/fieldsConfig';

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
      `(title ILIKE '%${escaped}%' OR list_contains(description, '${escaped}'))`
    );
  }

  // Geographic filter
  if (hasBbox) {
    whereClauses.push(
      `ST_Intersects(geometry, '${polygon}'::GEOMETRY)`
    );
  }

  // Facet filters
  const facetFields = [
    'location',
    'provider',
    'access_rights',
    'resource_class',
    'resource_type',
    'theme',
  ];

  facetFields.forEach((field) => {
    if (params[field]) {
      const values = String(params[field]).split(',');
      const escapedValues = values.map((v) => `'${escapeSqlString(v)}'`);

      if (field === 'provider' || field === 'access_rights') {
        // Scalar fields
        whereClauses.push(`${field} IN (${escapedValues.join(', ')})`);
      } else {
        // Array fields
        const conditions = escapedValues.map(
          (v) => `list_contains(${field}, ${v})`
        );
        whereClauses.push(`(${conditions.join(' OR ')})`);
      }
    }
  });

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
 * Build SQL query for facet aggregation
 */
export function buildFacetQuery(
  facetConfig: FieldConfig,
  params: SearchParams
): string {
  const whereClauses: string[] = [];

  // Apply same filters as main query (except the facet's own filter)
  if (params.q) {
    const escaped = escapeSqlString(params.q);
    whereClauses.push(
      `(title ILIKE '%${escaped}%' OR list_contains(description, '${escaped}'))`
    );
  }

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
  const facetFields = [
    'location',
    'provider',
    'access_rights',
    'resource_class',
    'resource_type',
    'theme',
  ];

  facetFields.forEach((field) => {
    if (field === facetConfig.field) return; // Skip own filter
    if (!params[field]) return;

    const values = String(params[field]).split(',');
    const escapedValues = values.map((v) => `'${escapeSqlString(v)}'`);

    if (field === 'provider' || field === 'access_rights') {
      whereClauses.push(`${field} IN (${escapedValues.join(', ')})`);
    } else {
      const conditions = escapedValues.map(
        (v) => `list_contains(${field}, ${v})`
      );
      whereClauses.push(`(${conditions.join(' OR ')})`);
    }
  });

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Build aggregation query
  if (facetConfig.isArray) {
    // Array fields need UNNEST
    return `
      SELECT unnested_value as value, COUNT(*) as count
      FROM parquet_data
      CROSS JOIN UNNEST(${facetConfig.field}) as t(unnested_value)
      ${whereClause}
      GROUP BY unnested_value
      ORDER BY count DESC
      LIMIT ${MAX_FACET_VALUES}
    `;
  } else {
    // Scalar fields
    return `
      SELECT ${facetConfig.field} as value, COUNT(*) as count
      FROM parquet_data
      ${whereClause}
      GROUP BY ${facetConfig.field}
      ORDER BY count DESC, ${facetConfig.field} ASC
      LIMIT ${MAX_FACET_VALUES}
    `;
  }
}
