import { describe, it, expect } from 'vitest';
import {
  parseBbox,
  bboxToWkt,
  formatBboxParam,
  isValidBbox,
  formatBboxLabel,
} from './spatial';

describe('parseBbox', () => {
  it('should parse valid bbox string', () => {
    const bbox = parseBbox('-122,37,-121,38');
    expect(bbox).toEqual({
      west: -122,
      south: 37,
      east: -121,
      north: 38,
    });
  });

  it('should return null for invalid bbox string', () => {
    expect(parseBbox('')).toBeNull();
    expect(parseBbox('invalid')).toBeNull();
    expect(parseBbox('1,2,3')).toBeNull();
  });

  it('should handle negative numbers', () => {
    const bbox = parseBbox('-180,-90,180,90');
    expect(bbox).toEqual({
      west: -180,
      south: -90,
      east: 180,
      north: 90,
    });
  });
});

describe('bboxToWkt', () => {
  it('should convert bbox to WKT POLYGON', () => {
    const bbox = { west: -122, south: 37, east: -121, north: 38 };
    const wkt = bboxToWkt(bbox);
    expect(wkt).toBe(
      'POLYGON((-122 38, -122 37, -121 37, -121 38, -122 38))'
    );
  });
});

describe('formatBboxParam', () => {
  it('should format bbox for URL parameter', () => {
    const bbox = { west: -122, south: 37, east: -121, north: 38 };
    expect(formatBboxParam(bbox)).toBe('-122,37,-121,38');
  });
});

describe('isValidBbox', () => {
  it('should validate correct bbox', () => {
    const bbox = { west: -122, south: 37, east: -121, north: 38 };
    expect(isValidBbox(bbox)).toBe(true);
  });

  it('should reject null bbox', () => {
    expect(isValidBbox(null)).toBe(false);
  });

  it('should reject bbox with north <= south', () => {
    const bbox = { west: -122, south: 38, east: -121, north: 37 };
    expect(isValidBbox(bbox)).toBe(false);
  });

  it('should reject bbox with east <= west', () => {
    const bbox = { west: -121, south: 37, east: -122, north: 38 };
    expect(isValidBbox(bbox)).toBe(false);
  });

  it('should reject bbox with values out of range', () => {
    const bbox1 = { west: -200, south: 37, east: -121, north: 38 };
    expect(isValidBbox(bbox1)).toBe(false);

    const bbox2 = { west: -122, south: 100, east: -121, north: 38 };
    expect(isValidBbox(bbox2)).toBe(false);
  });
});

describe('formatBboxLabel', () => {
  it('should format bbox with positive coordinates', () => {
    const bbox = { west: 2.22, south: 48.82, east: 2.47, north: 48.90 };
    const label = formatBboxLabel(bbox);
    expect(label).toBe('48.90°N 2.22°E 48.82°N 2.47°E');
  });

  it('should format bbox with negative coordinates', () => {
    const bbox = { west: -122.5, south: -37.8, east: -121.2, north: -36.5 };
    const label = formatBboxLabel(bbox);
    expect(label).toBe('36.50°S 122.50°W 37.80°S 121.20°W');
  });

  it('should format bbox with mixed coordinates', () => {
    const bbox = { west: -2.5, south: 48.0, east: 2.5, north: 49.0 };
    const label = formatBboxLabel(bbox);
    expect(label).toBe('49.00°N 2.50°W 48.00°N 2.50°E');
  });

  it('should handle zero coordinates', () => {
    const bbox = { west: 0, south: 0, east: 10, north: 10 };
    const label = formatBboxLabel(bbox);
    expect(label).toBe('10.00°N 0.00°E 0.00°N 10.00°E');
  });
});
