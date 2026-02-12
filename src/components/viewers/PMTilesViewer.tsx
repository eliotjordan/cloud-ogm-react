import { useMemo } from 'react';
import VectorTileLayer from 'ol/layer/VectorTile';
import { PMTilesVectorSource } from 'ol-pmtiles';
import { BaseOpenLayersViewer } from './BaseOpenLayersViewer';

interface PMTilesViewerProps {
  pmtilesUrl: string;
  geojson?: string;
}

/**
 * PMTiles vector tile viewer using OpenLayers
 */
export function PMTilesViewer({ pmtilesUrl, geojson }: PMTilesViewerProps) {
  const pmtilesLayer = useMemo(
    () =>
      new VectorTileLayer({
        source: new PMTilesVectorSource({
          url: pmtilesUrl,
        }),
        opacity: 0.8,
      }),
    [pmtilesUrl]
  );

  return (
    <BaseOpenLayersViewer
      dataLayer={pmtilesLayer}
      geojson={geojson}
      title="PMTiles Vector Viewer"
      deps={[pmtilesUrl]}
    />
  );
}
