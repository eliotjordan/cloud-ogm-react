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
});
