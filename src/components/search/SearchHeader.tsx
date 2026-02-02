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
  const hasManualThreshold = query.threshold !== undefined;
  const [manualThresholdEnabled, setManualThresholdEnabled] = useState(hasManualThreshold);
  const [thresholdValue, setThresholdValue] = useState(
    query.threshold !== undefined ? query.threshold : 0.3
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateSearchParams({ q: searchQuery || undefined, page: 1 });
  }

  function handleToggleMode() {
    const newMode = searchMode === 'text' ? 'semantic' : 'text';
    updateSearchParams({ mode: newMode, page: 1 });
  }

  function handleToggleManualThreshold() {
    const newEnabled = !manualThresholdEnabled;
    setManualThresholdEnabled(newEnabled);

    if (newEnabled) {
      // Enable manual threshold - set it in URL
      updateSearchParams({ threshold: thresholdValue, page: 1 });
    } else {
      // Disable manual threshold - remove from URL
      updateSearchParams({ threshold: undefined, page: 1 });
    }
  }

  function handleThresholdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = parseFloat(e.target.value);
    setThresholdValue(newValue);

    if (manualThresholdEnabled) {
      // Update URL immediately as user drags slider
      updateSearchParams({ threshold: newValue, page: 1 });
    }
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

      {/* Threshold Control - Only show in semantic mode */}
      {semanticSearchAvailable && searchMode === 'semantic' && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualThresholdEnabled}
                  onChange={handleToggleManualThreshold}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Manual threshold
                </span>
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {manualThresholdEnabled
                  ? `Current: ${thresholdValue.toFixed(2)}`
                  : 'Auto (based on query length)'}
              </span>
            </div>

            {manualThresholdEnabled && (
              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Less relevant
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={thresholdValue}
                  onChange={handleThresholdChange}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                  aria-label="Similarity threshold"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  More relevant
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
