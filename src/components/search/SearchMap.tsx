import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { MetadataRecord, SearchParams } from '@/types';
import { parseBbox, formatBboxParam, isValidBbox } from '@/utils/spatial';
import { updateSearchParams } from '@/lib/router';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/constants';

interface SearchMapProps {
  results: MetadataRecord[];
  query: SearchParams;
}

/**
 * Interactive map showing search results and geographic filters
 */
export function SearchMap({ results, query }: SearchMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const userMovedMap = useRef(false);
  const bboxRectRef = useRef<L.Rectangle | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([20, 0], 2);
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);

    // Track user-initiated map moves
    map.on('movestart', (e) => {
      if (!(e as any).programmatic) {
        userMovedMap.current = true;
      }
    });

    map.on('moveend', () => {
      if (userMovedMap.current) {
        setShowSearchHere(true);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update bbox rectangle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing rectangle
    if (bboxRectRef.current) {
      map.removeLayer(bboxRectRef.current);
      bboxRectRef.current = null;
    }

    const bbox = query.bbox ? parseBbox(query.bbox) : null;
    if (bbox && isValidBbox(bbox)) {
      const bounds = L.latLngBounds(
        [bbox.south, bbox.west],
        [bbox.north, bbox.east]
      );

      const rectangle = L.rectangle(bounds, {
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(map);

      bboxRectRef.current = rectangle;
    }
  }, [query.bbox]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    // Add new markers
    const newMarkers: L.Marker[] = [];
    results.forEach((result) => {
      if (result.geojson) {
        try {
          const geojson = JSON.parse(result.geojson);
          if (geojson.type === 'Point') {
            const [lng, lat] = geojson.coordinates;
            const marker = L.marker([lat, lng])
              .bindPopup(
                `<div class="p-2">
                  <strong>${result.title}</strong>
                  ${result.thumbnail ? `<br><img src="${result.thumbnail}" alt="" class="mt-2 max-w-[200px]">` : ''}
                </div>`
              )
              .addTo(map);
            newMarkers.push(marker);
          }
        } catch {
          // Ignore invalid GeoJSON
        }
      }
    });

    markersRef.current = newMarkers;

    // Fit bounds to results if no bbox filter
    if (results.length > 0 && !query.bbox) {
      const bounds = L.latLngBounds(
        newMarkers.map((marker) => marker.getLatLng())
      );
      if (bounds.isValid()) {
        (map.fitBounds(bounds, { padding: [50, 50] }) as any).programmatic =
          true;
        userMovedMap.current = false;
        setShowSearchHere(false);
      }
    }
  }, [results, query.bbox]);

  function handleSearchHere() {
    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const bbox = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    updateSearchParams({ bbox: formatBboxParam(bbox), page: 1 });
    userMovedMap.current = false;
    setShowSearchHere(false);
  }

  function handleClearBbox() {
    updateSearchParams({ bbox: undefined, page: 1 });
    userMovedMap.current = false;
    setShowSearchHere(false);
  }

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="h-96 rounded-lg shadow-lg" />

      {/* Search Here Button */}
      {showSearchHere && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            onClick={handleSearchHere}
            className="btn-primary shadow-lg"
            aria-label="Search this area"
          >
            Search Here
          </button>
        </div>
      )}

      {/* Clear Bbox Button */}
      {query.bbox && (
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={handleClearBbox}
            className="btn-secondary shadow-lg"
            aria-label="Clear geographic filter"
          >
            Clear Bbox
          </button>
        </div>
      )}
    </div>
  );
}
