import { useState } from 'react';
import type { FieldConfig, FacetValue } from '@/types';
import { toggleFilter } from '@/lib/router';

interface FacetPanelProps {
  config: FieldConfig;
  values: FacetValue[];
  selectedValues: string[];
  isExpanded: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

/**
 * Collapsible facet panel with checkboxes
 */
export function FacetPanel({
  config,
  values,
  selectedValues,
  isExpanded,
  onToggle,
  isLoading = false,
}: FacetPanelProps) {
  const [showModal, setShowModal] = useState(false);

  const hasMoreValues = values.length > 10;
  const displayValues = showModal ? values : values.slice(0, 10);

  return (
    <>
      <div className="card p-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          aria-expanded={isExpanded}
        >
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {config.label}
          </h2>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <svg
                  className="animate-spin h-6 w-6 text-primary-600 dark:text-primary-400"
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
              </div>
            ) : (
              <>
            {displayValues.map((facetValue) => {
              const isSelected = selectedValues.includes(facetValue.value);
              return (
                <label
                  key={facetValue.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      toggleFilter(config.field, facetValue.value, isSelected)
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {facetValue.value}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {facetValue.count.toLocaleString()}
                  </span>
                </label>
              );
            })}

            {hasMoreValues && !showModal && (
              <button
                onClick={() => setShowModal(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
              >
                Show more...
              </button>
            )}
            </>
            )}
          </div>
        )}
      </div>

      {/* Modal for showing all values */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card max-w-md w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="facet-modal-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                id="facet-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {config.label}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {values.map((facetValue) => {
                const isSelected = selectedValues.includes(facetValue.value);
                return (
                  <label
                    key={facetValue.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleFilter(config.field, facetValue.value, isSelected)
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {facetValue.value}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                      {facetValue.count.toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
