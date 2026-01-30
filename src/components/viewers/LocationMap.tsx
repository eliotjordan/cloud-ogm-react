import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/constants';

interface LocationMapProps {
  geojson?: string;
  title?: string;
}

/**
 * Simple Leaflet map showing item location
 */
export function LocationMap({ geojson, title }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([0, 0], 2);
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    try {
      const geoData = JSON.parse(geojson);
      const geoJsonLayer = L.geoJSON(geoData, {
        style: {
          color: '#6366f1',
          fillColor: '#6366f1',
          fillOpacity: 0.2,
          weight: 2,
        },
      }).addTo(map);

      if (title) {
        geoJsonLayer.bindPopup(title);
      }

      map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });
    } catch (error) {
      console.error('Failed to parse GeoJSON:', error);
    }
  }, [geojson, title]);

  if (!geojson) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Location
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No geometry data available
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Location
      </h2>
      <div ref={mapContainerRef} className="h-64 rounded-lg" />
    </div>
  );
}
