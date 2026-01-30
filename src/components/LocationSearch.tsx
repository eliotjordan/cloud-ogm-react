import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { buildSearchUrl, navigate } from '@/lib/router';
import { formatBboxParam } from '@/utils/spatial';
import type { NominatimPlace, BBox } from '@/types';
import {
  NOMINATIM_API_URL,
  DEBOUNCE_DELAY,
  MAX_AUTOCOMPLETE_RESULTS,
  EXCLUDED_LOCATION_TYPES,
} from '@/lib/constants';

/**
 * Location search component with Nominatim geocoding autocomplete
 */
export function LocationSearch() {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<NominatimPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedValue = useDebounce(inputValue, DEBOUNCE_DELAY);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search Nominatim when debounced value changes
  useEffect(() => {
    if (debouncedValue.length < 3) {
      setResults([]);
      return;
    }

    async function searchNominatim() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedValue,
          format: 'json',
          limit: String(MAX_AUTOCOMPLETE_RESULTS),
        });

        const response = await fetch(`${NOMINATIM_API_URL}?${params}`);
        if (!response.ok) throw new Error('Geocoding failed');

        const data: NominatimPlace[] = await response.json();

        // Filter out natural features
        const filtered = data.filter(
          (place) => !EXCLUDED_LOCATION_TYPES.includes(place.type)
        );

        setResults(filtered);
        setShowDropdown(true);
      } catch (error) {
        console.error('Nominatim search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    searchNominatim();
  }, [debouncedValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectPlace(place: NominatimPlace) {
    const [south, north, west, east] = place.boundingbox.map(Number);
    const bbox: BBox = { north, south, east, west };

    const url = buildSearchUrl({ bbox: formatBboxParam(bbox) });
    navigate(url);

    setInputValue('');
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Location filter..."
          className="input pl-10 w-full"
          aria-label="Search for a location"
          aria-autocomplete="list"
          aria-expanded={showDropdown && results.length > 0}
          role="combobox"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              className="animate-spin h-5 w-5 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {results.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handleSelectPlace(place)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
              role="option"
            >
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {place.display_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
