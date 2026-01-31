import { describe, it, expect } from 'vitest';
import {
  fieldsConfig,
  getFacetableFields,
  getCardFields,
  getItemFields,
  getFieldConfig,
} from './fieldsConfig';

describe('fieldsConfig', () => {
  it('should contain all expected fields', () => {
    const fieldNames = fieldsConfig.map((f) => f.field);

    // Core fields
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('title');
    expect(fieldNames).toContain('description');
    expect(fieldNames).toContain('provider');
    expect(fieldNames).toContain('location');

    // Geospatial fields
    expect(fieldNames).toContain('geometry');
    expect(fieldNames).toContain('geojson');

    // Resource classification
    expect(fieldNames).toContain('resource_class');
    expect(fieldNames).toContain('resource_type');
  });

  it('should have correct structure for each field config', () => {
    fieldsConfig.forEach((field) => {
      expect(field).toHaveProperty('field');
      expect(field).toHaveProperty('label');
      expect(field).toHaveProperty('isArray');
      expect(field).toHaveProperty('facetable');
      expect(field).toHaveProperty('displayOnCard');
      expect(field).toHaveProperty('displayOnItem');
      expect(typeof field.isArray).toBe('boolean');
      expect(typeof field.facetable).toBe('boolean');
    });
  });

  it('should have consistent array field definitions', () => {
    const arrayFields = fieldsConfig.filter((f) => f.isArray);

    // Known array fields
    expect(arrayFields.map((f) => f.field)).toContain('description');
    expect(arrayFields.map((f) => f.field)).toContain('creator');
    expect(arrayFields.map((f) => f.field)).toContain('location');
    expect(arrayFields.map((f) => f.field)).toContain('resource_class');
  });

  it('should mark appropriate fields as facetable', () => {
    const facetableFields = fieldsConfig.filter((f) => f.facetable);

    // Core facets
    expect(facetableFields.map((f) => f.field)).toContain('location');
    expect(facetableFields.map((f) => f.field)).toContain('provider');
    expect(facetableFields.map((f) => f.field)).toContain('access_rights');
    expect(facetableFields.map((f) => f.field)).toContain('resource_class');
  });
});

describe('getFacetableFields', () => {
  it('should return only facetable fields', () => {
    const facetable = getFacetableFields();

    expect(facetable.length).toBeGreaterThan(0);
    facetable.forEach((field) => {
      expect(field.facetable).toBe(true);
    });
  });

  it('should return expected facet fields', () => {
    const facetable = getFacetableFields();
    const fieldNames = facetable.map((f) => f.field);

    expect(fieldNames).toContain('location');
    expect(fieldNames).toContain('provider');
    expect(fieldNames).toContain('access_rights');
    expect(fieldNames).toContain('resource_class');
  });

  it('should not return non-facetable fields', () => {
    const facetable = getFacetableFields();
    const fieldNames = facetable.map((f) => f.field);

    expect(fieldNames).not.toContain('id');
    expect(fieldNames).not.toContain('title');
    expect(fieldNames).not.toContain('description');
  });
});

describe('getCardFields', () => {
  it('should return only fields for card display', () => {
    const cardFields = getCardFields();

    expect(cardFields.length).toBeGreaterThan(0);
    cardFields.forEach((field) => {
      expect(field.displayOnCard).toBe(true);
    });
  });

  it('should include essential card display fields', () => {
    const cardFields = getCardFields();
    const fieldNames = cardFields.map((f) => f.field);

    expect(fieldNames).toContain('title');
    expect(fieldNames).toContain('provider');
    expect(fieldNames).toContain('thumbnail');
  });

  it('should not include fields that are not for cards', () => {
    const cardFields = getCardFields();
    const fieldNames = cardFields.map((f) => f.field);

    expect(fieldNames).not.toContain('geometry');
    expect(fieldNames).not.toContain('references');
  });
});

describe('getItemFields', () => {
  it('should return only fields for item detail display', () => {
    const itemFields = getItemFields();

    expect(itemFields.length).toBeGreaterThan(0);
    itemFields.forEach((field) => {
      expect(field.displayOnItem).toBe(true);
    });
  });

  it('should include metadata fields for item detail', () => {
    const itemFields = getItemFields();
    const fieldNames = itemFields.map((f) => f.field);

    expect(fieldNames).toContain('description');
    expect(fieldNames).toContain('creator');
    expect(fieldNames).toContain('publisher');
    expect(fieldNames).toContain('provider');
  });

  it('should not include technical fields', () => {
    const itemFields = getItemFields();
    const fieldNames = itemFields.map((f) => f.field);

    expect(fieldNames).not.toContain('id');
    expect(fieldNames).not.toContain('geometry');
    expect(fieldNames).not.toContain('wxs_identifier');
  });
});

describe('getFieldConfig', () => {
  it('should return config for existing field', () => {
    const config = getFieldConfig('title');

    expect(config).toBeDefined();
    expect(config?.field).toBe('title');
    expect(config?.label).toBe('Title');
  });

  it('should return config with correct properties', () => {
    const config = getFieldConfig('provider');

    expect(config).toMatchObject({
      field: 'provider',
      label: 'Provider',
      isArray: false,
      facetable: true,
      displayOnCard: true,
      displayOnItem: true,
    });
  });

  it('should return undefined for non-existent field', () => {
    const config = getFieldConfig('nonexistent' as any);
    expect(config).toBeUndefined();
  });

  it('should return correct config for array fields', () => {
    const config = getFieldConfig('resource_class');

    expect(config?.isArray).toBe(true);
    expect(config?.facetable).toBe(true);
  });

  it('should return correct config for geospatial fields', () => {
    const geojsonConfig = getFieldConfig('geojson');
    const geometryConfig = getFieldConfig('geometry');

    expect(geojsonConfig?.displayOnItem).toBe(false);
    expect(geometryConfig?.displayOnItem).toBe(false);
  });
});
