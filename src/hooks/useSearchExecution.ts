import { useState, useEffect, useCallback } from 'react';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { SearchParams, MetadataRecord } from '@/types';
import { buildSearchQuery, buildSemanticSearchQuery } from '@/lib/queries';
import { parseResultRows } from '@/utils/duckdb';
import { isValidEmbedding } from '@/utils/embeddings';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import { useEmbeddings } from '@/hooks/useEmbeddings';

interface UseSearchExecutionResult {
  results: MetadataRecord[];
  totalResults: number;
  isLoading: boolean;
  semanticSearchAvailable: boolean;
  /** Generate a validated query embedding, or null if unavailable/invalid */
  getQueryEmbedding: (text: string) => Promise<Float32Array | null>;
}

/**
 * Handles search execution: builds and runs the search SQL (text or semantic),
 * falls back from semantic to text when no results are returned, and fetches
 * the total count.
 */
export function useSearchExecution(
  conn: AsyncDuckDBConnection,
  query: SearchParams,
  currentPage: number,
  onQueryTime: (time: number) => void
): UseSearchExecutionResult {
  const [results, setResults] = useState<MetadataRecord[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { addQuery, clearQueries } = useQueryHistory();
  const { model, isLoading: isLoadingModel, generateEmbedding } = useEmbeddings();

  const semanticSearchAvailable = !isLoadingModel && model !== null;

  /**
   * Generate a validated embedding for the given text.
   * Returns null when semantic search is unavailable or the embedding is invalid.
   * Memoized so downstream hooks can use it as a stable effect dependency.
   */
  const getQueryEmbedding = useCallback(
    async (text: string): Promise<Float32Array | null> => {
      if (!semanticSearchAvailable || !text) return null;

      const embedding = await generateEmbedding(text);
      if (!isValidEmbedding(embedding)) {
        console.warn('Invalid query embedding generated, using text search');
        return null;
      }
      return embedding;
    },
    [semanticSearchAvailable, generateEmbedding]
  );

  useEffect(() => {
    async function executeSearch() {
      setIsLoading(true);
      clearQueries();
      try {
        const overallStart = performance.now();

        let searchSql: string;
        let usedSemanticSearch = false;

        const queryEmbedding = await getQueryEmbedding(query.q || '');

        if (queryEmbedding) {
          searchSql = buildSemanticSearchQuery(
            query,
            queryEmbedding,
            currentPage,
            false,
            query.threshold
          );
          usedSemanticSearch = true;
        } else {
          searchSql = buildSearchQuery(query, currentPage);
        }

        const queryStart = performance.now();
        const searchResult = await conn.query(searchSql);
        const queryEnd = performance.now();
        addQuery(
          usedSemanticSearch ? 'Semantic Search Query' : 'Search Query',
          searchSql,
          queryEnd - queryStart
        );

        let records = parseResultRows<MetadataRecord>(searchResult);

        // Fall back to text search when semantic search returns nothing
        if (usedSemanticSearch && records.length === 0) {
          searchSql = buildSearchQuery(query, currentPage);

          const fallbackStart = performance.now();
          const fallbackResult = await conn.query(searchSql);
          const fallbackEnd = performance.now();
          addQuery('Text Search Query (fallback)', searchSql, fallbackEnd - fallbackStart);

          records = parseResultRows<MetadataRecord>(fallbackResult);
          usedSemanticSearch = false;
        }

        // Total count
        let countSql: string;
        if (usedSemanticSearch && queryEmbedding) {
          countSql = buildSemanticSearchQuery(
            query,
            queryEmbedding,
            currentPage,
            true,
            query.threshold
          );
        } else {
          countSql = buildSearchQuery(query, currentPage, true);
        }

        const countStart = performance.now();
        const countResult = await conn.query(countSql);
        const countEnd = performance.now();
        addQuery('Count Query', countSql, countEnd - countStart);
        const totalRaw = countResult.getChildAt(0)?.get(0);
        const total = typeof totalRaw === 'bigint' ? Number(totalRaw) : (totalRaw as number);

        const overallEnd = performance.now();
        onQueryTime(overallEnd - overallStart);

        setResults(records);
        setTotalResults(total);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    }

    executeSearch();
  }, [conn, query, currentPage, onQueryTime, addQuery, clearQueries, getQueryEmbedding]);

  return { results, totalResults, isLoading, semanticSearchAvailable, getQueryEmbedding };
}
