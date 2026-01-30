import type { MetadataRecord } from '@/types';
import { formatValue } from '@/utils/format';

interface MetadataCardProps {
  item: MetadataRecord;
}

/**
 * Card displaying all metadata fields for an item
 */
export function MetadataCard({ item }: MetadataCardProps) {
  const fields: Array<{ label: string; key: keyof MetadataRecord; isArray: boolean }> = [
    { label: 'Creator', key: 'creator', isArray: true },
    { label: 'Place', key: 'location', isArray: true },
    { label: 'Publisher', key: 'publisher', isArray: true },
    { label: 'Provider', key: 'provider', isArray: false },
    { label: 'Access Rights', key: 'access_rights', isArray: false },
    { label: 'Resource Class', key: 'resource_class', isArray: true },
    { label: 'Resource Type', key: 'resource_type', isArray: true },
    { label: 'Subject', key: 'subject', isArray: true },
    { label: 'Theme', key: 'theme', isArray: true },
    { label: 'Description', key: 'description', isArray: true },
    { label: 'Format', key: 'format', isArray: false },
    { label: 'Temporal', key: 'temporal', isArray: true },
  ];

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Full Details
      </h2>
      <dl className="space-y-4">
        {fields.map((field) => {
          const value = item[field.key];
          const formattedValue = formatValue(value, field.isArray);

          if (formattedValue === 'N/A') return null;

          return (
            <div key={field.key} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
              <dt className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {field.label}
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
