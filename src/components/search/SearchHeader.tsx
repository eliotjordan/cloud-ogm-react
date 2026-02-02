import { useState } from 'react';
import { LocationSearch } from '@/components/LocationSearch';
import { updateSearchParams } from '@/lib/router';
import type { SearchParams } from '@/types';

interface SearchHeaderProps {
  query: SearchParams;
  semanticSearchAvailable?: boolean;
}

/**
 * Search header with location and text search inputs
 */
export function SearchHeader({ query, semanticSearchAvailable = false }: SearchHeaderProps) {
  const [searchQuery, setSearchQuery] = useState(query.q || '');
  const searchMode = query.mode || 'text';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateSearchParams({ q: searchQuery || undefined, page: 1 });
  }

  function handleToggleMode() {
    const newMode = searchMode === 'text' ? 'semantic' : 'text';
    updateSearchParams({ mode: newMode, page: 1 });
  }

  return (
    <div className="card p-4 mb-6">
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          {/* Location Input */}
          <div className="flex-shrink-0 w-48">
            <LocationSearch />
          </div>

          {/* Text Search Input */}
          <div className="relative flex-1">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === 'semantic'
                  ? 'Describe what you\'re looking for...'
                  : 'Search for maps, data, imagery...'
              }
              className="input pl-10 w-full"
              aria-label="Search query"
            />
          </div>

          {/* Search Button */}
          <button type="submit" className="btn-primary px-8 flex-shrink-0">
            Search
          </button>
        </div>
      </form>

      {/* Search Mode Toggle */}
      {semanticSearchAvailable && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Search mode:
          </span>
          <button
            type="button"
            onClick={handleToggleMode}
            className={`
              px-3 py-1 text-sm rounded-md transition-colors
              ${
                searchMode === 'text'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }
            `}
            aria-pressed={searchMode === 'text'}
          >
            Text
          </button>
          <button
            type="button"
            onClick={handleToggleMode}
            className={`
              px-3 py-1 text-sm rounded-md transition-colors
              ${
                searchMode === 'semantic'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }
            `}
            aria-pressed={searchMode === 'semantic'}
          >
            Semantic
          </button>
          {searchMode === 'semantic' && (
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
              AI-powered search by meaning
            </span>
          )}
        </div>
      )}
    </div>
  );
}
