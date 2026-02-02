import type { MetadataRecord } from '@/types';

/**
 * Configuration for metadata fields
 * Defines how each field is used throughout the application
 */
export interface FieldConfig {
  field: keyof MetadataRecord;
  label: string;
  isArray: boolean;
  facetable: boolean; // Show as filter facet on search page
  displayOnCard: boolean; // Show on search result cards
  displayOnItem: boolean; // Show on item detail page
}

/**
 * Comprehensive field configuration for all metadata fields
 */
export const fieldsConfig: FieldConfig[] = [
  {
    field: 'id',
    label: 'ID',
    isArray: false,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false,
  },
  {
    field: 'title',
    label: 'Title',
    isArray: false,
    facetable: false,
    displayOnCard: true,
    displayOnItem: false, // Shown in header, not in metadata card
  },
  {
    field: 'description',
    label: 'Description',
    isArray: true,
    facetable: false,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'creator',
    label: 'Creator',
    isArray: true,
    facetable: false,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'location',
    label: 'Place',
    isArray: true,
    facetable: true,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'publisher',
    label: 'Publisher',
    isArray: true,
    facetable: false,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'provider',
    label: 'Provider',
    isArray: false,
    facetable: true,
    displayOnCard: true,
    displayOnItem: true,
  },
  {
    field: 'access_rights',
    label: 'Access Rights',
    isArray: false,
    facetable: true,
    displayOnCard: true,
    displayOnItem: true,
  },
  {
    field: 'resource_class',
    label: 'Resource Class',
    isArray: true,
    facetable: true,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'resource_type',
    label: 'Resource Type',
    isArray: true,
    facetable: true,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'subject',
    label: 'Subject',
    isArray: true,
    facetable: true,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'theme',
    label: 'Theme',
    isArray: true,
    facetable: true,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'format',
    label: 'Format',
    isArray: false,
    facetable: true,
    displayOnCard: true,
    displayOnItem: true,
  },
  {
    field: 'temporal',
    label: 'Temporal',
    isArray: true,
    facetable: false,
    displayOnCard: false,
    displayOnItem: true,
  },
  {
    field: 'index_year',
    label: 'Index Year',
    isArray: true,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false,
  },
  {
    field: 'modified',
    label: 'Modified',
    isArray: false,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false,
  },
  {
    field: 'identifier',
    label: 'Identifier',
    isArray: true,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false,
  },
  {
    field: 'thumbnail',
    label: 'Thumbnail',
    isArray: false,
    facetable: false,
    displayOnCard: true, // Used for image display
    displayOnItem: false,
  },
  {
    field: 'geojson',
    label: 'GeoJSON',
    isArray: false,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false, // Displayed via map
  },
  {
    field: 'geometry',
    label: 'Geometry',
    isArray: false,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false, // Displayed via map
  },
  {
    field: 'references',
    label: 'References',
    isArray: false,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false, // Parsed for viewers/downloads
  },
  {
    field: 'wxs_identifier',
    label: 'WxS Identifier',
    isArray: false,
    facetable: false,
    displayOnCard: false,
    displayOnItem: false, // Used internally for WMS
  },
];

/**
 * Get fields that should be used as facets
 */
export function getFacetableFields(): FieldConfig[] {
  return fieldsConfig.filter((field) => field.facetable);
}

/**
 * Get fields that should be displayed on search result cards
 */
export function getCardFields(): FieldConfig[] {
  return fieldsConfig.filter((field) => field.displayOnCard);
}

/**
 * Get fields that should be displayed on item detail page
 */
export function getItemFields(): FieldConfig[] {
  return fieldsConfig.filter((field) => field.displayOnItem);
}

/**
 * Get configuration for a specific field
 */
export function getFieldConfig(fieldName: keyof MetadataRecord): FieldConfig | undefined {
  return fieldsConfig.find((field) => field.field === fieldName);
}
