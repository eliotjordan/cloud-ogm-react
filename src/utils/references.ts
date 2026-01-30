import type { ParsedReferences } from '@/types';
import { REFERENCE_KEYS } from '@/lib/constants';

/**
 * Parse the references JSON field from metadata records
 */
export function parseReferences(
  referencesJson?: string
): ParsedReferences | null {
  if (!referencesJson) return null;

  try {
    const refs = JSON.parse(referencesJson);
    if (typeof refs !== 'object' || refs === null) return null;

    return {
      iiifManifest: refs[REFERENCE_KEYS.IIIF_MANIFEST],
      wms: refs[REFERENCE_KEYS.WMS],
      cog: refs[REFERENCE_KEYS.COG],
      pmtiles: refs[REFERENCE_KEYS.PMTILES],
      download: refs[REFERENCE_KEYS.DOWNLOAD],
    };
  } catch (error) {
    console.error('Failed to parse references:', error);
    return null;
  }
}

/**
 * Check if references contain any viewer URLs
 */
export function hasViewers(refs: ParsedReferences | null): boolean {
  if (!refs) return false;
  return !!(refs.iiifManifest || refs.wms || refs.cog || refs.pmtiles);
}
