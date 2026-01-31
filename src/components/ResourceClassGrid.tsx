import type { ResourceClassInfo } from '@/types';
import { formatNumber } from '@/utils/format';
import { getResourceClassIcon } from '@/utils/icons';

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
              {getResourceClassIcon(resourceClass.name)}
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
