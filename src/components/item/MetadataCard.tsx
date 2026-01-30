import type { MetadataRecord } from '@/types';
import { formatValue } from '@/utils/format';
import { getItemFields } from '@/lib/fieldsConfig';

interface MetadataCardProps {
  item: MetadataRecord;
}

/**
 * Card displaying all metadata fields for an item
 */
export function MetadataCard({ item }: MetadataCardProps) {
  const fields = getItemFields();

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Full Details
      </h2>
      <dl className="space-y-4">
        {fields.map((fieldConfig) => {
          const value = item[fieldConfig.field];
          const formattedValue = formatValue(value, fieldConfig.isArray);

          if (formattedValue === 'N/A') return null;

          return (
            <div key={fieldConfig.field} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
              <dt className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {fieldConfig.label}
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">
                {formattedValue}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
