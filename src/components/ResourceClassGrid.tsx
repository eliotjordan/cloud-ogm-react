import type { ResourceClassInfo } from '@/types';
import { formatNumber } from '@/utils/format';

interface ResourceClassGridProps {
  classes: ResourceClassInfo[];
  onClassClick: (className: string) => void;
  onBrowseAll: () => void;
}

/**
 * List of resource class cards with counts
 */
export function ResourceClassGrid({
  classes,
  onClassClick,
  onBrowseAll,
}: ResourceClassGridProps) {
  return (
    <div className="space-y-3">
      {/* Browse All Resources */}
      <button
        onClick={onBrowseAll}
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-left"
        aria-label="Browse all resources"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
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
          <span className="text-base text-gray-900 dark:text-gray-100">
            Browse All Resources
          </span>
        </div>
      </button>

      {/* Resource Classes */}
      {classes.map((resourceClass) => (
        <button
          key={resourceClass.name}
          onClick={() => onClassClick(resourceClass.name)}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-left"
          aria-label={`Browse ${resourceClass.name} - ${formatNumber(resourceClass.count)} resources`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {getIconPath(resourceClass.name)}
            </svg>
            <span className="flex-1 text-base text-gray-900 dark:text-gray-100">
              {resourceClass.name}
            </span>
            <span className="text-base text-gray-600 dark:text-gray-400 tabular-nums">
              {formatNumber(resourceClass.count)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Get SVG path for resource class icon
 */
function getIconPath(className: string): JSX.Element {
  switch (className) {
    case 'Maps':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      );
    case 'Datasets':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      );
    case 'Imagery':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      );
    case 'Collections':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      );
    case 'Web Services':
    case 'Web services':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      );
    case 'Websites':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      );
    default:
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      );
  }
}
