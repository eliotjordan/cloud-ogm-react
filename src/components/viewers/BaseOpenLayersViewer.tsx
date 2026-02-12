import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import type BaseLayer from 'ol/layer/Base';
import 'ol/ol.css';

interface BaseOpenLayersViewerProps {
  /** The data layer to display on top of the OSM base map */
  dataLayer: BaseLayer;
  /** GeoJSON string used to fit the map extent */
  geojson?: string;
  /** Title shown in the card header */
  title: string;
  /** Optional subtitle shown below the title */
  subtitle?: string;
  /** Dependency values that should trigger a map re-initialization */
  deps?: unknown[];
}

/**
 * Shared OpenLayers map viewer with OSM base layer, GeoJSON extent fitting,
 * card wrapper, and cleanup on unmount.
 */
export function BaseOpenLayersViewer({
  dataLayer,
  geojson,
  title,
  subtitle,
  deps = [],
}: BaseOpenLayersViewerProps) {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const osmLayer = new TileLayer({ source: new OSM() });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [osmLayer, dataLayer],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    mapRef.current = map;

    if (geojson) {
      try {
        const format = new GeoJSON();
        const features = format.readFeature(geojson, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });

        const feature = Array.isArray(features) ? features[0] : features;
        const extent = feature?.getGeometry()?.getExtent();
        if (extent) {
          map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 16,
          });
        }
      } catch (error) {
        console.error(`Failed to parse GeoJSON for ${title}:`, error);
      }
    }

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson, dataLayer, ...deps]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div ref={mapContainerRef} className="h-[640px]" />
    </div>
  );
}
