import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
import ImageWMS from 'ol/source/ImageWMS';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';

interface WMSViewerProps {
  wmsUrl: string;
  layerName?: string;
  geojson?: string;
}

/**
 * WMS layer viewer using OpenLayers
 */
export function WMSViewer({ wmsUrl, layerName, geojson }: WMSViewerProps) {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Base layer
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    // WMS layer
    const wmsLayer = new ImageLayer({
      source: new ImageWMS({
        url: wmsUrl,
        params: layerName ? { LAYERS: layerName } : {},
        ratio: 1,
      }),
      opacity: 0.8,
    });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [osmLayer, wmsLayer],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    mapRef.current = map;

    // Fit to geometry if available
    if (geojson) {
      try {
        const geoData = JSON.parse(geojson);
        if (geoData.coordinates) {
          const coords = geoData.coordinates;
          if (geoData.type === 'Point') {
            map.getView().setCenter(fromLonLat(coords));
            map.getView().setZoom(10);
          }
        }
      } catch (error) {
        console.error('Failed to parse GeoJSON for WMS viewer:', error);
      }
    }

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [wmsUrl, layerName, geojson]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          WMS Layer Viewer
        </h2>
        {layerName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Layer: {layerName}
          </p>
        )}
      </div>
      <div ref={mapContainerRef} className="h-[640px]" />
    </div>
  );
}
