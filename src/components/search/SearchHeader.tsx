import { useState } from 'react';
import { LocationSearch } from '@/components/LocationSearch';
import { updateSearchParams } from '@/lib/router';
import type { SearchParams } from '@/types';

interface SearchHeaderProps {
  query: SearchParams;
}

/**
 * Search header with location and text search inputs
 */
export function SearchHeader({ query }: SearchHeaderProps) {
  const [searchQuery, setSearchQuery] = useState(query.q || '');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateSearchParams({ q: searchQuery || undefined, page: 1 });
  }

  return (
    <div className="card p-6 mb-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <LocationSearch />

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
  );
}
