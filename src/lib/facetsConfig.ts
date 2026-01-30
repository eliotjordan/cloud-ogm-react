import type { FacetConfig } from '@/types';

/**
 * Configuration for faceted search filters
 * Defines which fields are filterable and how they should be displayed
 */
export const facetsConfig: FacetConfig[] = [
  {
    field: 'location',
    label: 'Place',
    isArray: true,
  },
  {
    field: 'provider',
    label: 'Provider',
    isArray: false,
  },
  {
    field: 'access_rights',
    label: 'Access Rights',
    isArray: false,
  },
  {
    field: 'resource_class',
    label: 'Resource Class',
    isArray: true,
  },
  {
    field: 'resource_type',
    label: 'Resource Type',
    isArray: true,
  },
  {
    field: 'theme',
    label: 'Theme',
    isArray: true,
  },
];
