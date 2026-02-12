import { useMemo } from 'react';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';
import { BaseOpenLayersViewer } from './BaseOpenLayersViewer';

interface COGViewerProps {
  cogUrl: string;
  geojson?: string;
}

/**
 * Cloud Optimized GeoTIFF viewer using OpenLayers
 */
export function COGViewer({ cogUrl, geojson }: COGViewerProps) {
  const cogLayer = useMemo(
    () =>
      new WebGLTileLayer({
        source: new GeoTIFF({
          sources: [{ url: cogUrl }],
        }),
        opacity: 0.8,
      }),
    [cogUrl]
  );

  return (
    <BaseOpenLayersViewer
      dataLayer={cogLayer}
      geojson={geojson}
      title="Cloud Optimized GeoTIFF Viewer"
      deps={[cogUrl]}
    />
  );
}
