import { describe, it, expect } from 'vitest';
import { buildSearchQuery, buildFacetQuery, buildSemanticSearchQuery, buildItemDetailQuery } from './queries';
import type { SearchParams, FieldConfig } from '@/types';

describe('buildSearchQuery', () => {
  it('should build basic search query without filters', () => {
    const params: SearchParams = {};
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('SELECT');
    expect(sql).toContain('FROM parquet_data');
    expect(sql).toContain('LIMIT');
    expect(sql).toContain('OFFSET');
  });

  it('should always filter out suppressed records', () => {
    const params: SearchParams = {};
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('suppressed IS NOT TRUE');
  });

  it('should include text search filter', () => {
    const params: SearchParams = { q: 'test' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('title ILIKE');
    expect(sql).toContain('%test%');
  });

  it('should escape SQL special characters in text search', () => {
    const params: SearchParams = { q: "test'query" };
    const sql = buildSearchQuery(params, 1);

    // Should escape single quotes
    expect(sql).toContain("test''query");
  });

  it('should include bbox filter with ST_Intersects', () => {
    const params: SearchParams = { bbox: '-122,37,-121,38' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('ST_Intersects');
    expect(sql).toContain('POLYGON');
    expect(sql).toContain('geometry');
  });

  it('should include bbox in ORDER BY when present', () => {
    const params: SearchParams = { bbox: '-122,37,-121,38' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('ORDER BY ratio ASC');
    expect(sql).toContain('ratio');
  });

  it('should not include ORDER BY without bbox', () => {
    const params: SearchParams = { q: 'test' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).not.toContain('ORDER BY');
    expect(sql).not.toContain('ratio');
  });

  it('should handle scalar facet filter (provider)', () => {
    const params: SearchParams = { provider: 'Stanford' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('provider IN');
    expect(sql).toContain("'Stanford'");
  });

  it('should handle multiple scalar facet values', () => {
    const params: SearchParams = { provider: 'Stanford,MIT' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('provider IN');
    expect(sql).toContain("'Stanford'");
    expect(sql).toContain("'MIT'");
  });

  it('should handle array facet filter (location)', () => {
    const params: SearchParams = { location: 'Paris' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('list_contains');
    expect(sql).toContain('location');
    expect(sql).toContain("'Paris'");
  });

  it('should handle multiple array facet values with OR', () => {
    const params: SearchParams = { location: 'Paris,London' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('list_contains(location,');
    expect(sql).toContain("'Paris'");
    expect(sql).toContain("'London'");
    expect(sql).toContain('OR');
  });

  it('should combine multiple filters with AND', () => {
    const params: SearchParams = {
      q: 'map',
      provider: 'Stanford',
      location: 'Paris',
    };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('title ILIKE');
    expect(sql).toContain('provider IN');
    expect(sql).toContain('list_contains(location,');
    expect(sql).toContain('AND');
  });

  it('should build count query when countOnly is true', () => {
    const params: SearchParams = { q: 'test' };
    const sql = buildSearchQuery(params, 1, true);

    expect(sql).toContain('SELECT COUNT(*)');
    expect(sql).not.toContain('LIMIT');
    expect(sql).not.toContain('OFFSET');
    expect(sql).toContain('WHERE');
  });

  it('should handle pagination correctly', () => {
    const params: SearchParams = {};
    const page1 = buildSearchQuery(params, 1);
    const page2 = buildSearchQuery(params, 2);

    expect(page1).toContain('LIMIT 10 OFFSET 0');
    expect(page2).toContain('LIMIT 10 OFFSET 10');
  });

  it('should handle all facetable fields', () => {
    const params: SearchParams = {
      location: 'Paris',
      provider: 'Stanford',
      access_rights: 'Public',
      resource_class: 'Maps',
      resource_type: 'Image',
      theme: 'Transportation',
      format: 'ArcGRID',
      subject: 'Environment',
    };
    const sql = buildSearchQuery(params, 1);

    // Array fields
    expect(sql).toContain('list_contains(location,');
    expect(sql).toContain('list_contains(resource_class,');
    expect(sql).toContain('list_contains(resource_type,');
    expect(sql).toContain('list_contains(theme,');
    expect(sql).toContain('list_contains(subject,');

    // Scalar fields
    expect(sql).toContain('provider IN');
    expect(sql).toContain('access_rights IN');
    expect(sql).toContain('format IN');
  });

  it('should handle format filter as scalar field', () => {
    const params: SearchParams = { format: 'ArcGRID' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('format IN');
    expect(sql).toContain("'ArcGRID'");
    expect(sql).not.toContain('list_contains');
  });

  it('should handle subject filter as array field', () => {
    const params: SearchParams = { subject: 'Environment' };
    const sql = buildSearchQuery(params, 1);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('list_contains(subject,');
    expect(sql).toContain("'Environment'");
  });

  it('should select required fields for search', () => {
    const params: SearchParams = {};
    const sql = buildSearchQuery(params, 1);

    // Essential fields (geometry excluded to reduce transfer size)
    expect(sql).toContain('id');
    expect(sql).toContain('geojson');
    expect(sql).not.toMatch(/\bgeometry\b/);
  });
});

describe('buildFacetQuery', () => {
  it('should always filter out suppressed records', () => {
    const facetConfig: FieldConfig = {
      field: 'location',
      label: 'Place',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {};
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('suppressed IS NOT TRUE');
  });

  it('should build facet query for array field', () => {
    const facetConfig: FieldConfig = {
      field: 'location',
      label: 'Place',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {};
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('SELECT unnested_value as value');
    expect(sql).toContain('COUNT(*) as count');
    expect(sql).toContain('CROSS JOIN UNNEST');
    expect(sql).toContain('location');
    expect(sql).toContain('GROUP BY unnested_value');
    expect(sql).toContain('ORDER BY count DESC');
    expect(sql).toContain('LIMIT 20');
  });

  it('should build facet query for scalar field', () => {
    const facetConfig: FieldConfig = {
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: true,
      displayOnItem: true,
    };
    const params: SearchParams = {};
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('SELECT provider as value');
    expect(sql).toContain('COUNT(*) as count');
    expect(sql).not.toContain('UNNEST');
    expect(sql).toContain('GROUP BY provider');
    expect(sql).toContain('ORDER BY count DESC, provider ASC');
  });

  it('should apply text search filter to facet query', () => {
    const facetConfig: FieldConfig = {
      field: 'location',
      label: 'Place',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = { q: 'map' };
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('title ILIKE');
    expect(sql).toContain('%map%');
  });

  it('should apply bbox filter to facet query', () => {
    const facetConfig: FieldConfig = {
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: true,
      displayOnItem: true,
    };
    const params: SearchParams = { bbox: '-122,37,-121,38' };
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('WHERE');
    expect(sql).toContain('ST_Intersects');
    expect(sql).toContain('POLYGON');
  });

  it('should apply other facet filters but exclude own field', () => {
    const facetConfig: FieldConfig = {
      field: 'location',
      label: 'Place',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {
      location: 'Paris', // Should be excluded
      provider: 'Stanford', // Should be included
    };
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('provider IN');
    expect(sql).not.toContain('list_contains(location,');
  });

  it('should combine multiple filters in facet query', () => {
    const facetConfig: FieldConfig = {
      field: 'resource_class',
      label: 'Resource Class',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {
      q: 'test',
      provider: 'Stanford',
      location: 'Paris',
    };
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('title ILIKE');
    expect(sql).toContain('provider IN');
    expect(sql).toContain('list_contains(location,');
    expect(sql).not.toContain('list_contains(resource_class,');
  });

  it('should handle facet query with no filters', () => {
    const facetConfig: FieldConfig = {
      field: 'theme',
      label: 'Theme',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {};
    const sql = buildFacetQuery(facetConfig, params);

    // Should filter out NULL and empty values even with no user filters
    expect(sql).toContain('suppressed IS NOT TRUE AND unnested_value IS NOT NULL');
    expect(sql).toContain("unnested_value != ''");
    expect(sql).toContain('GROUP BY');
    expect(sql).toContain('ORDER BY');
  });

  it('should escape SQL in facet filters', () => {
    const facetConfig: FieldConfig = {
      field: 'location',
      label: 'Place',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = { provider: "O'Brien" };
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain("O''Brien");
  });

  it('should handle semantic search with embeddings', () => {
    const facetConfig: FieldConfig = {
      field: 'theme',
      label: 'Theme',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.1, 0.2, 0.3]);
    const sql = buildFacetQuery(facetConfig, params, queryEmbedding);

    // Should filter by embeddings
    expect(sql).toContain('embeddings IS NOT NULL');
    expect(sql).toContain('list_dot_product(embeddings,');
    expect(sql).toContain('ARRAY[0.1');
    expect(sql).toContain('filtered_data');
  });

  it('should handle semantic search with custom threshold', () => {
    const facetConfig: FieldConfig = {
      field: 'resource_class',
      label: 'Resource Class',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const userThreshold = 0.8;
    const sql = buildFacetQuery(facetConfig, params, queryEmbedding, userThreshold);

    // Should use custom threshold
    expect(sql).toContain('>= 0.8');
    expect(sql).toContain('list_dot_product(embeddings,');
  });

  it('should combine semantic search with bbox filter', () => {
    const facetConfig: FieldConfig = {
      field: 'location',
      label: 'Place',
      isArray: true,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {
      q: 'test',
      bbox: '-122,37,-121,38',
    };
    const queryEmbedding = new Float32Array([0.1, 0.2]);
    const sql = buildFacetQuery(facetConfig, params, queryEmbedding);

    // Should include both filters
    expect(sql).toContain('ST_Intersects');
    expect(sql).toContain('list_dot_product(embeddings,');
    expect(sql).toContain('embeddings IS NOT NULL');
  });
});

describe('buildSemanticSearchQuery', () => {
  it('should build basic semantic search query', () => {
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.1, 0.2, 0.3]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    expect(sql).toContain('SELECT');
    expect(sql).toContain('list_dot_product(embeddings,');
    expect(sql).toContain('ARRAY[0.1');
    expect(sql).toContain('embeddings IS NOT NULL');
    expect(sql).toContain('similarity');
    expect(sql).toContain('ORDER BY similarity DESC');
    expect(sql).toContain('LIMIT');
    expect(sql).toContain('OFFSET');
  });

  it('should always filter out suppressed records', () => {
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.1, 0.2, 0.3]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    expect(sql).toContain('suppressed IS NOT TRUE');
  });

  it('should include bbox filter in semantic search', () => {
    const params: SearchParams = { q: 'test', bbox: '-122,37,-121,38' };
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    expect(sql).toContain('ST_Intersects');
    expect(sql).toContain('POLYGON');
    expect(sql).toContain('ratio');
    expect(sql).toContain('ORDER BY similarity DESC, ratio ASC');
  });

  it('should include facet filters in semantic search', () => {
    const params: SearchParams = {
      q: 'test',
      provider: 'Stanford',
      resource_class: 'Maps',
    };
    const queryEmbedding = new Float32Array([0.1, 0.2]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    expect(sql).toContain('provider IN');
    expect(sql).toContain('list_contains(resource_class,');
    expect(sql).toContain('Stanford');
    expect(sql).toContain('Maps');
  });

  it('should use custom similarity threshold', () => {
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const userThreshold = 0.9;
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1, false, userThreshold);

    expect(sql).toContain('similarity >= 0.9');
  });

  it('should build count query for semantic search', () => {
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.1, 0.2]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1, true);

    expect(sql).toContain('SELECT COUNT(*)');
    expect(sql).toContain('list_dot_product(embeddings,');
    expect(sql).toContain('similarity >=');
    expect(sql).not.toContain('LIMIT');
    expect(sql).not.toContain('OFFSET');
  });

  it('should include count query filters', () => {
    const params: SearchParams = {
      q: 'test',
      provider: 'Stanford',
    };
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1, true);

    expect(sql).toContain('COUNT(*)');
    expect(sql).toContain('provider IN');
    expect(sql).toContain('embeddings IS NOT NULL');
  });

  it('should escape SQL in semantic search filters', () => {
    const params: SearchParams = {
      q: 'test',
      provider: "O'Brien",
    };
    const queryEmbedding = new Float32Array([0.1, 0.2]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    expect(sql).toContain("O''Brien");
  });

  it('should handle multiple array facet filters', () => {
    const params: SearchParams = {
      q: 'test',
      resource_class: 'Maps,Datasets',
      theme: 'Environment',
    };
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    expect(sql).toContain('list_contains(resource_class,');
    expect(sql).toContain('Maps');
    expect(sql).toContain('Datasets');
    expect(sql).toContain('list_contains(theme,');
    expect(sql).toContain('Environment');
  });

  it('should handle pagination', () => {
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.1, 0.2]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 3);

    // Page 3 should have OFFSET 20 (10 per page * 2)
    expect(sql).toContain('LIMIT 10');
    expect(sql).toContain('OFFSET 20');
  });

  it('should handle semantic search without query text', () => {
    const params: SearchParams = { provider: 'Stanford' };
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    // Should still work without q parameter
    expect(sql).toContain('list_dot_product(embeddings,');
    expect(sql).toContain('provider IN');
    expect(sql).toContain('similarity');
  });

  it('should build count query without query text', () => {
    const params: SearchParams = { bbox: '-122,37,-121,38' };
    const queryEmbedding = new Float32Array([0.1, 0.2]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1, true);

    expect(sql).toContain('SELECT COUNT(*)');
    expect(sql).toContain('ST_Intersects');
    expect(sql).toContain('similarity >=');
  });

  it('should handle semantic search with no filters at all', () => {
    const params: SearchParams = {};
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const sql = buildSemanticSearchQuery(params, queryEmbedding, 1);

    // Should have minimal WHERE clause - just embeddings IS NOT NULL
    expect(sql).toContain('embeddings IS NOT NULL');
    expect(sql).toContain('list_dot_product(embeddings,');
    expect(sql).toContain('similarity');
  });
});

describe('buildFacetQuery - scalar fields', () => {
  it('should handle scalar field facet query', () => {
    const facetConfig: FieldConfig = {
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = { q: 'test' };
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('SELECT provider as value');
    expect(sql).toContain('COUNT(*) as count');
    expect(sql).toContain('GROUP BY provider');
    expect(sql).toContain('provider IS NOT NULL');
    expect(sql).not.toContain('UNNEST');
  });

  it('should handle scalar field with semantic search', () => {
    const facetConfig: FieldConfig = {
      field: 'access_rights',
      label: 'Access Rights',
      isArray: false,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = { q: 'test' };
    const queryEmbedding = new Float32Array([0.5, 0.5]);
    const sql = buildFacetQuery(facetConfig, params, queryEmbedding);

    expect(sql).toContain('SELECT access_rights as value');
    expect(sql).toContain('filtered_data');
    expect(sql).toContain('list_dot_product(embeddings,');
    expect(sql).not.toContain('UNNEST');
  });

  it('should handle scalar field without filters', () => {
    const facetConfig: FieldConfig = {
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {};
    const sql = buildFacetQuery(facetConfig, params);

    expect(sql).toContain('suppressed IS NOT TRUE AND provider IS NOT NULL');
    expect(sql).toContain("provider != ''");
    expect(sql).toContain('GROUP BY provider');
  });

  it('should handle scalar field semantic search without query text', () => {
    const facetConfig: FieldConfig = {
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: false,
      displayOnItem: true,
    };
    const params: SearchParams = {};
    const queryEmbedding = new Float32Array([0.1, 0.2, 0.3]);
    const sql = buildFacetQuery(facetConfig, params, queryEmbedding);

    expect(sql).toContain('SELECT provider as value');
    expect(sql).toContain('filtered_data');
    expect(sql).toContain('list_dot_product(embeddings,');
  });
});

describe('buildItemDetailQuery', () => {
  it('should select only item detail fields, excluding embeddings and geometry', () => {
    const sql = buildItemDetailQuery('test-id-123');

    expect(sql).toContain("WHERE id = 'test-id-123'");
    expect(sql).toContain('LIMIT 1');
    expect(sql).toContain('title');
    expect(sql).toContain('geojson');
    expect(sql).toContain('references');
    expect(sql).toContain('description');
    expect(sql).not.toContain('embeddings');
    expect(sql).not.toMatch(/\bgeometry\b/);
  });

  it('should escape single quotes in item ID', () => {
    const sql = buildItemDetailQuery("it's-a-test");

    expect(sql).toContain("it''s-a-test");
  });
});
