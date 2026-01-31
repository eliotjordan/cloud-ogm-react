import type { MetadataRecord } from '@/types';
import { navigate } from '@/lib/router';
import { formatValue } from '@/utils/format';
import { getResourceClassIcon } from '@/utils/icons';

interface ResultsGridProps {
  results: MetadataRecord[];
}

/**
 * Grid of search result cards
 */
export function ResultsGrid({ results }: ResultsGridProps) {
  function handleCardClick(id: string) {
    navigate(`#/item/${id}`);
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => handleCardClick(result.id)}
          className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-left group"
          aria-label={`View details for ${result.title}`}
        >
          <div className="flex gap-4">
            {/* Thumbnail or Icon */}
            <div className="flex-shrink-0">
              {result.thumbnail ? (
                <img
                  src={result.thumbnail}
                  alt=""
                  className="w-24 h-24 object-cover rounded border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    // Hide broken image and show icon instead
                    e.currentTarget.style.display = 'none';
                    const iconContainer = e.currentTarget.nextElementSibling;
                    if (iconContainer instanceof HTMLElement) {
                      iconContainer.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-24 h-24 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${result.thumbnail ? 'hidden' : 'flex'}`}
              >
                <svg
                  className="w-12 h-12 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {getResourceClassIcon(result.resource_class)}
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                {result.title}
              </h3>

              {result.description && result.description.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                  {formatValue(result.description, true)}
                </p>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                {result.provider && (
                  <span className="font-medium">{result.provider}</span>
                )}
                {result.access_rights && (
                  <>
                    <span>•</span>
                    <span>{result.access_rights}</span>
                  </>
                )}
                {result.format && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      {result.format}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
