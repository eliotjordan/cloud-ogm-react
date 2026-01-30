import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { PMTilesVectorSource } from 'ol-pmtiles';
import 'ol/ol.css';

interface PMTilesViewerProps {
  pmtilesUrl: string;
  geojson?: string;
}

/**
 * PMTiles vector tile viewer using OpenLayers
 */
export function PMTilesViewer({ pmtilesUrl, geojson }: PMTilesViewerProps) {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Base layer
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    // PMTiles layer
    const pmtilesLayer = new VectorTileLayer({
      source: new PMTilesVectorSource({
        url: pmtilesUrl,
      }),
      opacity: 0.8,
    });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [osmLayer, pmtilesLayer],
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
        console.error('Failed to parse GeoJSON for PMTiles viewer:', error);
      }
    }

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [pmtilesUrl, geojson]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          PMTiles Vector Viewer
        </h2>
      </div>
      <div ref={mapContainerRef} className="h-[640px]" />
    </div>
  );
}
