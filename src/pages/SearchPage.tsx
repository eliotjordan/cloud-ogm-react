import { useState, useEffect } from 'react';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { SearchParams, MetadataRecord, FacetValue } from '@/types';
import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchMap } from '@/components/search/SearchMap';
import { FacetPanel } from '@/components/search/FacetPanel';
import { ActiveFilters } from '@/components/search/ActiveFilters';
import { ResultsGrid } from '@/components/search/ResultsGrid';
import { Pagination } from '@/components/search/Pagination';
import { buildSearchQuery, buildSemanticSearchQuery, buildFacetQuery } from '@/lib/queries';
import { getFacetableFields } from '@/lib/fieldsConfig';
import { calculatePagination } from '@/utils/pagination';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import { useEmbeddings } from '@/hooks/useEmbeddings';

const facetsConfig = getFacetableFields();

interface SearchPageProps {
  conn: AsyncDuckDBConnection;
  query: SearchParams;
  onQueryTime: (time: number) => void;
}

/**
 * Search page with faceted filters, map, and results
 */
export function SearchPage({ conn, query, onQueryTime }: SearchPageProps) {
  const [results, setResults] = useState<MetadataRecord[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [facets, setFacets] = useState<Record<string, FacetValue[]>>({});
  const [expandedFacets, setExpandedFacets] = useState<Record<string, boolean>>({});
  const [loadedFacets, setLoadedFacets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { addQuery, clearQueries } = useQueryHistory();
  const { model, isLoading: isLoadingModel, generateEmbedding } = useEmbeddings();

  const currentPage = query.page || 1;
  const pagination = calculatePagination(currentPage, totalResults);
  const semanticSearchAvailable = !isLoadingModel && model !== null;

  // Initialize expanded state based on selected values
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    facetsConfig.forEach((facetConfig) => {
      const selectedValues = getSelectedValues(query, facetConfig.field);
      initialExpanded[facetConfig.field] = selectedValues.length > 0;
    });
    setExpandedFacets(initialExpanded);
  }, [query]);

  // Execute search when query parameters change
  useEffect(() => {
    async function executeSearch() {
      setIsLoading(true);
      clearQueries(); // Clear previous queries
      try {
        const overallStart = performance.now();

        // Build and execute main search query
        let searchSql: string;
        let usedSemanticSearch = false;

        // Try semantic search first if available and we have a query
        if (semanticSearchAvailable && query.q) {
          const queryEmbedding = await generateEmbedding(query.q);

          // Validate embedding is not null and doesn't contain NaN/zero values
          const isValidEmbedding = queryEmbedding &&
            queryEmbedding.length > 0 &&
            !Array.from(queryEmbedding).every(v => v === 0) &&
            Array.from(queryEmbedding).every(v => !isNaN(v) && isFinite(v));

          if (isValidEmbedding) {
            searchSql = buildSemanticSearchQuery(
              query,
              queryEmbedding,
              currentPage,
              false,
              query.threshold
            );
            usedSemanticSearch = true;
          } else {
            console.warn('Invalid query embedding generated, using text search');
            searchSql = buildSearchQuery(query, currentPage);
          }
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

        // Parse results
        let records: MetadataRecord[] = [];
        for (let i = 0; i < searchResult.numRows; i++) {
          const record: Partial<MetadataRecord> = {};
          searchResult.schema.fields.forEach((field, idx) => {
            const value = searchResult.getChildAt(idx)?.get(i);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            record[field.name as keyof MetadataRecord] = value as any;
          });
          records.push(record as MetadataRecord);
        }

        // If semantic search returned no results, fall back to text search
        if (usedSemanticSearch && records.length === 0) {
          console.log('Semantic search returned no results, falling back to text search');
          searchSql = buildSearchQuery(query, currentPage);

          const fallbackQueryStart = performance.now();
          const fallbackResult = await conn.query(searchSql);
          const fallbackQueryEnd = performance.now();
          addQuery('Text Search Query (fallback)', searchSql, fallbackQueryEnd - fallbackQueryStart);

          records = [];
          for (let i = 0; i < fallbackResult.numRows; i++) {
            const record: Partial<MetadataRecord> = {};
            fallbackResult.schema.fields.forEach((field, idx) => {
              const value = fallbackResult.getChildAt(idx)?.get(i);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              record[field.name as keyof MetadataRecord] = value as any;
            });
            records.push(record as MetadataRecord);
          }

          usedSemanticSearch = false; // Update flag since we're now using text search
        }

        // Get total count using the same search mode that was actually used
        let countSql: string;
        if (usedSemanticSearch && query.q) {
          const queryEmbedding = await generateEmbedding(query.q);
          if (queryEmbedding) {
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
        } else {
          countSql = buildSearchQuery(query, currentPage, true);
        }

        const countStart = performance.now();
        const countResult = await conn.query(countSql);
        const countEnd = performance.now();
        addQuery('Count Query', countSql, countEnd - countStart);
        const totalRaw = countResult.getChildAt(0)?.get(0);
        const total = typeof totalRaw === 'bigint' ? Number(totalRaw) : totalRaw as number;

        const overallEnd = performance.now();
        onQueryTime(overallEnd - overallStart);

        setResults(records);
        setTotalResults(total);

        // Clear loaded facets when query changes so they reload with new filters
        setLoadedFacets({});
        setFacets({});
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    }

    executeSearch();
  }, [conn, query, currentPage, onQueryTime, addQuery, clearQueries, semanticSearchAvailable, generateEmbedding]);

  // Load facet data when a facet is expanded
  useEffect(() => {
    async function loadExpandedFacets() {
      const facetsToLoad = facetsConfig.filter(
        (config) => expandedFacets[config.field] && !loadedFacets[config.field]
      );

      if (facetsToLoad.length === 0) return;

      try {
        // Generate query embedding for semantic search if available and query exists
        let queryEmbedding: Float32Array | null = null;
        if (semanticSearchAvailable && query.q) {
          queryEmbedding = await generateEmbedding(query.q);

          // Validate embedding
          const isValidEmbedding = queryEmbedding &&
            queryEmbedding.length > 0 &&
            !Array.from(queryEmbedding).every(v => v === 0) &&
            Array.from(queryEmbedding).every(v => !isNaN(v) && isFinite(v));

          if (!isValidEmbedding) {
            queryEmbedding = null;
          }
        }

        const facetPromises = facetsToLoad.map(async (facetConfig) => {
          // Pass query embedding to buildFacetQuery for semantic filtering
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
              count: typeof countRaw === 'bigint' ? Number(countRaw) : countRaw as number,
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
  }, [conn, query, expandedFacets, loadedFacets, addQuery, semanticSearchAvailable, generateEmbedding]);

  function handleToggleFacet(field: string) {
    setExpandedFacets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Visually hidden h1 for accessibility */}
      <h1 className="sr-only">Search Results</h1>

      {/* Map */}
      <div className="mb-6">
        <SearchMap results={results} query={query} />
      </div>

      {/* Search Header */}
      <SearchHeader query={query} semanticSearchAvailable={semanticSearchAvailable} />

      {/* Active Filters */}
      <ActiveFilters query={query} facetsConfig={facetsConfig} />

      {/* Two-column layout: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Facets */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {facetsConfig.map((facetConfig) => (
              <FacetPanel
                key={facetConfig.field}
                config={facetConfig}
                values={facets[facetConfig.field] || []}
                selectedValues={getSelectedValues(query, facetConfig.field)}
                isExpanded={expandedFacets[facetConfig.field] || false}
                onToggle={() => handleToggleFacet(facetConfig.field)}
                isLoading={
                  expandedFacets[facetConfig.field] &&
                  !loadedFacets[facetConfig.field]
                }
              />
            ))}
          </div>
        </aside>

        {/* Main content - Results */}
        <div className="lg:col-span-3">
          <h2 className="sr-only">Search Results List</h2>
          {!isLoading && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {pagination.startResult}–{pagination.endResult} of{' '}
                {pagination.totalResults.toLocaleString()} results
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <svg
                className="animate-spin h-12 w-12 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Loading results...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                No results found. Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <ResultsGrid results={results} />
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination pagination={pagination} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get selected filter values for a field from query params
 */
function getSelectedValues(query: SearchParams, field: string): string[] {
  const value = query[field];
  if (!value) return [];
  return typeof value === 'string' ? value.split(',') : [];
}
