import { useState, useEffect } from 'react';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { buildSearchUrl, navigate } from '@/lib/router';
import { LocationSearch } from '@/components/LocationSearch';
import { ResourceClassGrid } from '@/components/ResourceClassGrid';
import type { ResourceClassInfo } from '@/types';
import { formatNumber } from '@/utils/format';

interface HomePageProps {
  conn: AsyncDuckDBConnection;
  onQueryTime: (time: number) => void;
}

/**
 * Home page with search bar and browse by resource class
 */
export function HomePage({ conn, onQueryTime }: HomePageProps) {
  const [query, setQuery] = useState('');
  const [resourceClasses, setResourceClasses] = useState<ResourceClassInfo[]>(
    []
  );
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Load resource class counts on mount
  useEffect(() => {
    async function loadResourceClasses() {
      try {
        const startTime = performance.now();
        const result = await conn.query(`
          SELECT unnested_value as name, COUNT(*) as count
          FROM parquet_data
          CROSS JOIN UNNEST(resource_class) as t(unnested_value)
          GROUP BY unnested_value
          ORDER BY count DESC, unnested_value ASC
        `);
        const endTime = performance.now();
        onQueryTime(endTime - startTime);

        const classes: ResourceClassInfo[] = [];
        for (let i = 0; i < result.numRows; i++) {
          classes.push({
            name: result.getChildAt(0)?.get(i) as string,
            count: result.getChildAt(1)?.get(i) as number,
            icon: getResourceClassIcon(result.getChildAt(0)?.get(i) as string),
          });
        }

        setResourceClasses(classes);
      } catch (error) {
        console.error('Failed to load resource classes:', error);
      } finally {
        setIsLoadingClasses(false);
      }
    }

    loadResourceClasses();
  }, [conn, onQueryTime]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      const url = buildSearchUrl({ q: query.trim() });
      navigate(url);
    }
  }

  function handleBrowseAll() {
    navigate('#/search');
  }

  function handleResourceClassClick(className: string) {
    const url = buildSearchUrl({ resource_class: className });
    navigate(url);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Search OpenGeoMetadata
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover and explore geospatial resources from institutions worldwide.
          Search through thousands of maps, datasets, imagery, web services, and
          more.
        </p>
      </div>

      {/* Search Inputs */}
      <div className="card p-6 mb-12">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Location Search */}
          <LocationSearch />

          {/* Text Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for maps, data, imagery..."
              className="input pl-10"
              aria-label="Search query"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Search
          </button>
        </form>
      </div>

      {/* Browse by Resource Class */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Browse by Resource Class
          </h2>
          <button
            onClick={handleBrowseAll}
            className="btn-secondary text-sm"
            aria-label="Browse all resources"
          >
            Browse All Resources
          </button>
        </div>

        {isLoadingClasses ? (
          <div className="text-center py-12 text-gray-500">
            Loading categories...
          </div>
        ) : (
          <ResourceClassGrid
            classes={resourceClasses}
            onClassClick={handleResourceClassClick}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Get icon name for resource class
 */
function getResourceClassIcon(className: string): string {
  const icons: Record<string, string> = {
    Maps: '🗺️',
    Datasets: '📊',
    Imagery: '🛰️',
    'Web Services': '🌐',
    Collections: '📚',
    Websites: '💻',
  };
  return icons[className] || '🌍';
}
