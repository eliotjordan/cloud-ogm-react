import { describe, it, expect } from 'vitest';
import {
  formatValue,
  formatNumber,
  escapeSqlString,
  getThumbnailPlaceholder,
} from './format';

describe('formatValue', () => {
  it('should return "N/A" for null or undefined', () => {
    expect(formatValue(null)).toBe('N/A');
    expect(formatValue(undefined)).toBe('N/A');
  });

  it('should format arrays as comma-separated strings', () => {
    expect(formatValue(['a', 'b', 'c'], true)).toBe('a, b, c');
    expect(formatValue([1, 2, 3], true)).toBe('1, 2, 3');
  });

  it('should return "N/A" for empty arrays', () => {
    expect(formatValue([], true)).toBe('N/A');
  });

  it('should filter out null values from arrays', () => {
    expect(formatValue(['a', null, 'b'], true)).toBe('a, b');
  });

  it('should convert non-array values to strings', () => {
    expect(formatValue('hello')).toBe('hello');
    expect(formatValue(42)).toBe('42');
    expect(formatValue(true)).toBe('true');
  });

  it('should JSON.stringify objects', () => {
    expect(formatValue({ key: 'value' })).toBe('{"key":"value"}');
  });

  it('should handle Apache Arrow vectors with toArray method', () => {
    const mockVector = {
      toArray: () => ['arrow', 'value'],
    };
    expect(formatValue(mockVector, true)).toBe('arrow, value');
  });

  it('should handle Apache Arrow vectors that throw errors', () => {
    const mockVector = {
      toArray: () => {
        throw new Error('Arrow conversion failed');
      },
    };
    // Should fallback to object stringification after error
    // Functions are not serialized in JSON.stringify
    expect(formatValue(mockVector)).toBe('{}');
  });

  it('should parse JSON string arrays when isArray is true', () => {
    expect(formatValue('["item1", "item2"]', true)).toBe('item1, item2');
  });

  it('should handle invalid JSON strings gracefully', () => {
    expect(formatValue('[invalid json', true)).toBe('[invalid json');
  });

  it('should handle arrays with object elements', () => {
    expect(formatValue([{ id: 1 }, { id: 2 }], true)).toBe(
      '{"id":1}, {"id":2}'
    );
  });

  it('should handle arrays with mixed types', () => {
    expect(formatValue([1, 'text', true], true)).toBe('1, text, true');
  });
});

describe('formatNumber', () => {
  it('should format numbers with thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(42)).toBe('42');
  });
});

describe('escapeSqlString', () => {
  it('should escape single quotes', () => {
    expect(escapeSqlString("it's")).toBe("it''s");
    expect(escapeSqlString("O'Reilly")).toBe("O''Reilly");
  });

  it('should handle strings without quotes', () => {
    expect(escapeSqlString('hello')).toBe('hello');
  });

  it('should escape multiple quotes', () => {
    expect(escapeSqlString("'it's'")).toBe("''it''s''");
  });
});

describe('getThumbnailPlaceholder', () => {
  it('should return map placeholder for Maps', () => {
    expect(getThumbnailPlaceholder('Maps')).toBe('/map-placeholder.svg');
    expect(getThumbnailPlaceholder(['Maps', 'Other'])).toBe(
      '/map-placeholder.svg'
    );
  });

  it('should return dataset placeholder for Datasets', () => {
    expect(getThumbnailPlaceholder('Datasets')).toBe(
      '/dataset-placeholder.svg'
    );
  });

  it('should return globe placeholder for unknown types', () => {
    expect(getThumbnailPlaceholder('Unknown')).toBe('/globe-placeholder.svg');
    expect(getThumbnailPlaceholder(undefined)).toBe('/globe-placeholder.svg');
  });

  it('should return imagery placeholder for Imagery', () => {
    expect(getThumbnailPlaceholder('Imagery')).toBe('/imagery-placeholder.svg');
  });

  it('should return service placeholder for Web Services', () => {
    expect(getThumbnailPlaceholder('Web Services')).toBe(
      '/service-placeholder.svg'
    );
  });

  it('should return collection placeholder for Collections', () => {
    expect(getThumbnailPlaceholder('Collections')).toBe(
      '/collection-placeholder.svg'
    );
  });

  it('should handle arrays and use first element', () => {
    expect(getThumbnailPlaceholder(['Imagery', 'Maps'])).toBe(
      '/imagery-placeholder.svg'
    );
  });
});
