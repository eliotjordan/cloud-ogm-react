import type { ResourceClassInfo } from '@/types';
import { formatNumber } from '@/utils/format';

interface ResourceClassGridProps {
  classes: ResourceClassInfo[];
  onClassClick: (className: string) => void;
}

/**
 * Grid of resource class cards with counts
 */
export function ResourceClassGrid({
  classes,
  onClassClick,
}: ResourceClassGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes.map((resourceClass) => (
        <button
          key={resourceClass.name}
          onClick={() => onClassClick(resourceClass.name)}
          className="card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-left group"
          aria-label={`Browse ${resourceClass.name} - ${formatNumber(resourceClass.count)} resources`}
        >
          <div className="flex items-start gap-4">
            <div
              className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              {resourceClass.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {resourceClass.name}
              </h3>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                {formatNumber(resourceClass.count)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {resourceClass.count === 1 ? 'resource' : 'resources'}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}
