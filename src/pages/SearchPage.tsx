import { useState, useEffect } from 'react';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { SearchParams, MetadataRecord, FacetValue } from '@/types';
import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchMap } from '@/components/search/SearchMap';
import { FacetPanel } from '@/components/search/FacetPanel';
import { ActiveFilters } from '@/components/search/ActiveFilters';
import { ResultsGrid } from '@/components/search/ResultsGrid';
import { Pagination } from '@/components/search/Pagination';
import { buildSearchQuery, buildFacetQuery } from '@/lib/queries';
import { getFacetableFields } from '@/lib/fieldsConfig';
import { calculatePagination } from '@/utils/pagination';
import { useQueryHistory } from '@/hooks/useQueryHistory';

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
  const [isLoading, setIsLoading] = useState(false);
  const { addQuery, clearQueries } = useQueryHistory();

  const currentPage = query.page || 1;
  const pagination = calculatePagination(currentPage, totalResults);

  // Execute search when query parameters change
  useEffect(() => {
    async function executeSearch() {
      setIsLoading(true);
      clearQueries(); // Clear previous queries
      try {
        const overallStart = performance.now();

        // Build and execute main search query
        const searchSql = buildSearchQuery(query, currentPage);
        const queryStart = performance.now();
        const searchResult = await conn.query(searchSql);
        const queryEnd = performance.now();
        addQuery('Search Query', searchSql, queryEnd - queryStart);

        // Parse results
        const records: MetadataRecord[] = [];
        for (let i = 0; i < searchResult.numRows; i++) {
          const record: Partial<MetadataRecord> = {};
          searchResult.schema.fields.forEach((field, idx) => {
            const value = searchResult.getChildAt(idx)?.get(i);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            record[field.name as keyof MetadataRecord] = value as any;
          });
          records.push(record as MetadataRecord);
        }

        // Get total count
        const countSql = buildSearchQuery(query, currentPage, true);
        const countStart = performance.now();
        const countResult = await conn.query(countSql);
        const countEnd = performance.now();
        addQuery('Count Query', countSql, countEnd - countStart);
        const totalRaw = countResult.getChildAt(0)?.get(0);
        const total = typeof totalRaw === 'bigint' ? Number(totalRaw) : totalRaw as number;

        // Execute facet queries in parallel
        const facetPromises = facetsConfig.map(async (facetConfig) => {
          const facetSql = buildFacetQuery(facetConfig, query);
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
        const facetMap = Object.fromEntries(facetResults);

        const overallEnd = performance.now();
        onQueryTime(overallEnd - overallStart);

        setResults(records);
        setTotalResults(total);
        setFacets(facetMap);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    }

    executeSearch();
  }, [conn, query, currentPage, onQueryTime, addQuery, clearQueries]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Visually hidden h1 for accessibility */}
      <h1 className="sr-only">Search Results</h1>

      {/* Map */}
      <div className="mb-6">
        <SearchMap results={results} query={query} />
      </div>

      {/* Search Header */}
      <SearchHeader query={query} />

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
