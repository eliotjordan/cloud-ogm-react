import { useState, useEffect, useCallback } from 'react';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { SearchParams, FacetValue, FieldConfig } from '@/types';
import { buildFacetQuery } from '@/lib/queries';
import { getFacetableFields } from '@/lib/fieldsConfig';
import { useQueryHistory } from '@/hooks/useQueryHistory';

const facetsConfig = getFacetableFields();

interface UseFacetLoaderResult {
  facetsConfig: FieldConfig[];
  facets: Record<string, FacetValue[]>;
  expandedFacets: Record<string, boolean>;
  loadedFacets: Record<string, boolean>;
  handleToggleFacet: (field: string) => void;
}

/**
 * Manages facet expansion state and loads facet data on demand.
 * Accepts a getQueryEmbedding callback so facet queries can apply
 * semantic similarity filtering when appropriate.
 */
export function useFacetLoader(
  conn: AsyncDuckDBConnection,
  query: SearchParams,
  getQueryEmbedding: (text: string) => Promise<Float32Array | null>
): UseFacetLoaderResult {
  const [facets, setFacets] = useState<Record<string, FacetValue[]>>({});
  const [expandedFacets, setExpandedFacets] = useState<Record<string, boolean>>({});
  const [loadedFacets, setLoadedFacets] = useState<Record<string, boolean>>({});
  const { addQuery } = useQueryHistory();

  // Auto-expand facets that have selected values
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    facetsConfig.forEach((facetConfig) => {
      const value = query[facetConfig.field];
      const hasSelection = typeof value === 'string' && value.length > 0;
      initialExpanded[facetConfig.field] = hasSelection;
    });
    setExpandedFacets(initialExpanded);
  }, [query]);

  // Reset loaded facets when query changes so they reload with new filters
  useEffect(() => {
    setLoadedFacets({});
    setFacets({});
  }, [query]);

  // Load facet data when a facet is expanded
  useEffect(() => {
    async function loadExpandedFacets() {
      const facetsToLoad = facetsConfig.filter(
        (config) => expandedFacets[config.field] && !loadedFacets[config.field]
      );

      if (facetsToLoad.length === 0) return;

      try {
        const queryEmbedding = await getQueryEmbedding(query.q || '');

        const facetPromises = facetsToLoad.map(async (facetConfig) => {
          const facetSql = buildFacetQuery(
            facetConfig,
            query,
            queryEmbedding || undefined,
            query.threshold
          );
          const facetStart = performance.now();
          const facetResult = await conn.query(facetSql);
          const facetEnd = performance.now();
          addQuery(`Facet: ${facetConfig.label}`, facetSql, facetEnd - facetStart);

          const values: FacetValue[] = [];
          for (let i = 0; i < facetResult.numRows; i++) {
            const countRaw = facetResult.getChildAt(1)?.get(i);
            values.push({
              value: facetResult.getChildAt(0)?.get(i) as string,
              count: typeof countRaw === 'bigint' ? Number(countRaw) : (countRaw as number),
            });
          }

          return [facetConfig.field, values] as const;
        });

        const facetResults = await Promise.all(facetPromises);

        setFacets((prev) => ({
          ...prev,
          ...Object.fromEntries(facetResults),
        }));

        setLoadedFacets((prev) => {
          const newLoaded = { ...prev };
          facetsToLoad.forEach((config) => {
            newLoaded[config.field] = true;
          });
          return newLoaded;
        });
      } catch (error) {
        console.error('Error loading facets:', error);
      }
    }

    loadExpandedFacets();
  }, [conn, query, expandedFacets, loadedFacets, addQuery, getQueryEmbedding]);

  const handleToggleFacet = useCallback((field: string) => {
    setExpandedFacets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  return { facetsConfig, facets, expandedFacets, loadedFacets, handleToggleFacet };
}
