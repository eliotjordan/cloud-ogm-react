import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { SearchParams } from '@/types';
import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchMap } from '@/components/search/SearchMap';
import { FacetPanel } from '@/components/search/FacetPanel';
import { ActiveFilters } from '@/components/search/ActiveFilters';
import { ResultsGrid } from '@/components/search/ResultsGrid';
import { Pagination } from '@/components/search/Pagination';
import { Spinner } from '@/components/Spinner';
import { calculatePagination } from '@/utils/pagination';
import { useSearchExecution } from '@/hooks/useSearchExecution';
import { useFacetLoader } from '@/hooks/useFacetLoader';

interface SearchPageProps {
  conn: AsyncDuckDBConnection;
  query: SearchParams;
  onQueryTime: (time: number) => void;
}

/**
 * Search page with faceted filters, map, and results
 */
export function SearchPage({ conn, query, onQueryTime }: SearchPageProps) {
  const currentPage = query.page || 1;

  const { results, totalResults, isLoading, semanticSearchAvailable, getQueryEmbedding } =
    useSearchExecution(conn, query, currentPage, onQueryTime);

  const { facetsConfig, facets, expandedFacets, loadedFacets, handleToggleFacet } =
    useFacetLoader(conn, query, getQueryEmbedding);

  const pagination = calculatePagination(currentPage, totalResults);

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
            <div className="card">
              <Spinner message="Loading results..." />
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
