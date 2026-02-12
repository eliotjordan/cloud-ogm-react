import { useMemo } from 'react';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { BaseOpenLayersViewer } from './BaseOpenLayersViewer';

interface WMSViewerProps {
  wmsUrl: string;
  layerName?: string;
  geojson?: string;
}

/**
 * WMS layer viewer using OpenLayers
 */
export function WMSViewer({ wmsUrl, layerName, geojson }: WMSViewerProps) {
  const wmsLayer = useMemo(
    () =>
      new ImageLayer({
        source: new ImageWMS({
          url: wmsUrl,
          params: layerName ? { LAYERS: layerName } : {},
          ratio: 1,
        }),
        opacity: 0.8,
      }),
    [wmsUrl, layerName]
  );

  return (
    <BaseOpenLayersViewer
      dataLayer={wmsLayer}
      geojson={geojson}
      title="WMS Layer Viewer"
      subtitle={layerName ? `Layer: ${layerName}` : undefined}
      deps={[wmsUrl, layerName]}
    />
  );
}
