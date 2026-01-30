import type { SearchParams, FacetConfig } from '@/types';
import { parseBbox, bboxToWkt, isValidBbox } from '@/utils/spatial';
import { escapeSqlString } from '@/utils/format';
import { getPaginationSql } from '@/utils/pagination';
import { MAX_FACET_VALUES } from '@/lib/constants';

/**
 * Build SQL query for searching metadata records
 */
export function buildSearchQuery(
  params: SearchParams,
  page: number,
  countOnly: boolean = false
): string {
  const whereClauses: string[] = [];

  // Text search
  if (params.q) {
    const escaped = escapeSqlString(params.q);
    whereClauses.push(
      `(title ILIKE '%${escaped}%' OR list_contains(description, '${escaped}'))`
    );
  }

  // Geographic filter
  if (params.bbox) {
    const bbox = parseBbox(params.bbox);
    if (bbox && isValidBbox(bbox)) {
      const wkt = bboxToWkt(bbox);
      whereClauses.push(
        `ST_Within('${wkt}'::GEOMETRY, geometry)`
      );
    }
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

  const { limit, offset } = getPaginationSql(page);
  return `
    SELECT *
    FROM parquet_data
    ${whereClause}
    ORDER BY provider ASC, title ASC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

/**
 * Build SQL query for facet aggregation
 */
export function buildFacetQuery(
  facetConfig: FacetConfig,
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
        `ST_Within('${wkt}'::GEOMETRY, geometry)`
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
      ORDER BY count DESC, unnested_value ASC
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
