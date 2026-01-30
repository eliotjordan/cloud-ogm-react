import type { SearchParams, FieldConfig } from '@/types';
import { clearFilters, updateSearchParams } from '@/lib/router';

interface ActiveFiltersProps {
  query: SearchParams;
  facetsConfig: FieldConfig[];
}

/**
 * Display active filters as chips with remove buttons
 */
export function ActiveFilters({ query, facetsConfig }: ActiveFiltersProps) {
  const activeFilters: Array<{ field: string; value: string; label: string }> =
    [];

  facetsConfig.forEach((config) => {
    const value = query[config.field];
    if (value) {
      const values = typeof value === 'string' ? value.split(',') : [String(value)];
      values.forEach((v) => {
        activeFilters.push({
          field: config.field,
          value: v,
          label: `${config.label}: ${v}`,
        });
      });
    }
  });

  if (activeFilters.length === 0) return null;

  function handleRemoveFilter(field: string, value: string) {
    const currentValue = query[field];
    if (!currentValue) return;

    const values =
      typeof currentValue === 'string' ? currentValue.split(',') : [];
    const newValues = values.filter((v) => v !== value);

    updateSearchParams({
      [field]: newValues.length > 0 ? newValues.join(',') : undefined,
      page: 1,
    });
  }

  return (
    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Active Filters:
        </span>

        {activeFilters.map((filter, idx) => (
          <button
            key={`${filter.field}-${filter.value}-${idx}`}
            onClick={() => handleRemoveFilter(filter.field, filter.value)}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 rounded-full text-sm hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={`Remove filter: ${filter.label}`}
          >
            <span>{filter.label}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ))}

        {activeFilters.length > 1 && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
