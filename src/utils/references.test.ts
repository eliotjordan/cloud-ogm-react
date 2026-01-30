import { describe, it, expect } from 'vitest';
import { parseReferences, hasViewers } from './references';
import { REFERENCE_KEYS } from '@/lib/constants';

describe('parseReferences', () => {
  it('should parse valid references JSON', () => {
    const json = JSON.stringify({
      [REFERENCE_KEYS.IIIF_MANIFEST]: 'https://example.com/manifest.json',
      [REFERENCE_KEYS.WMS]: 'https://example.com/wms',
      [REFERENCE_KEYS.DOWNLOAD]: 'https://example.com/download',
    });

    const result = parseReferences(json);
    expect(result).toEqual({
      iiifManifest: 'https://example.com/manifest.json',
      wms: 'https://example.com/wms',
      cog: undefined,
      pmtiles: undefined,
      download: 'https://example.com/download',
    });
  });

  it('should return null for invalid JSON', () => {
    expect(parseReferences('invalid json')).toBeNull();
  });

  it('should return null for non-object JSON', () => {
    expect(parseReferences('"string"')).toBeNull();
    expect(parseReferences('123')).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseReferences(undefined)).toBeNull();
  });
});

describe('hasViewers', () => {
  it('should return true if any viewer URL exists', () => {
    expect(hasViewers({ iiifManifest: 'url', wms: undefined, cog: undefined, pmtiles: undefined })).toBe(true);
    expect(hasViewers({ iiifManifest: undefined, wms: 'url', cog: undefined, pmtiles: undefined })).toBe(true);
    expect(hasViewers({ iiifManifest: undefined, wms: undefined, cog: 'url', pmtiles: undefined })).toBe(true);
    expect(hasViewers({ iiifManifest: undefined, wms: undefined, cog: undefined, pmtiles: 'url' })).toBe(true);
  });

  it('should return false if no viewer URLs exist', () => {
    expect(hasViewers({ iiifManifest: undefined, wms: undefined, cog: undefined, pmtiles: undefined })).toBe(false);
  });

  it('should return false for null input', () => {
    expect(hasViewers(null)).toBe(false);
  });
});
