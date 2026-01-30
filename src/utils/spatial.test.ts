import { describe, it, expect } from 'vitest';
import {
  parseBbox,
  bboxToWkt,
  formatBboxParam,
  isValidBbox,
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
