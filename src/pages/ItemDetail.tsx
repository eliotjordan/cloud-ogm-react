import { useState, useEffect } from 'react';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { MetadataRecord } from '@/types';
import { parseReferences } from '@/utils/references';
import { IIIFViewer } from '@/components/viewers/IIIFViewer';
import { WMSViewer } from '@/components/viewers/WMSViewer';
import { COGViewer } from '@/components/viewers/COGViewer';
import { PMTilesViewer } from '@/components/viewers/PMTilesViewer';
import { LocationMap } from '@/components/viewers/LocationMap';
import { DownloadsCard } from '@/components/item/DownloadsCard';
import { MetadataCard } from '@/components/item/MetadataCard';
import { useQueryHistory } from '@/hooks/useQueryHistory';

interface ItemDetailProps {
  itemId: string;
  conn: AsyncDuckDBConnection;
  onQueryTime: (time: number) => void;
}

/**
 * Item detail page showing full metadata and viewers
 */
export function ItemDetail({ itemId, conn, onQueryTime }: ItemDetailProps) {
  const [item, setItem] = useState<MetadataRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addQuery, clearQueries } = useQueryHistory();

  useEffect(() => {
    async function loadItem() {
      try {
        clearQueries(); // Clear previous queries
        const overallStart = performance.now();

        const sql = `
          SELECT *
          FROM parquet_data
          WHERE id = '${itemId.replace(/'/g, "''")}'
          LIMIT 1
        `;
        const queryStart = performance.now();
        const result = await conn.query(sql);
        const queryEnd = performance.now();
        addQuery('Item Detail Query', sql, queryEnd - queryStart);

        const overallEnd = performance.now();
        onQueryTime(overallEnd - overallStart);

        if (result.numRows === 0) {
          setError('Item not found');
          return;
        }

        const record: Partial<MetadataRecord> = {};
        result.schema.fields.forEach((field, idx) => {
          const value = result.getChildAt(idx)?.get(0);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          record[field.name as keyof MetadataRecord] = value as any;
        });

        setItem(record as MetadataRecord);
      } catch (err) {
        console.error('Failed to load item:', err);
        setError('Failed to load item details');
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [itemId, conn, onQueryTime, addQuery, clearQueries]);

  function handleBack() {
    window.history.back();
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {error || 'Item not found'}
          </p>
          <button onClick={handleBack} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const refs = parseReferences(item.references);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 -ml-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Search
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {item.title}
        </h1>
      </div>

      {/* Viewers */}
      <div className="space-y-6 mb-8">
        {refs?.iiifManifest ? (
          <IIIFViewer iiifContent={refs.iiifManifest} />
        ) : refs?.iiifImage ? (
          <IIIFViewer iiifContent={refs.iiifImage} />
        ) : null}
        {refs?.wms && (
          <WMSViewer
            wmsUrl={refs.wms}
            layerName={item.wxs_identifier}
            geojson={item.geojson}
          />
        )}
        {refs?.cog && <COGViewer cogUrl={refs.cog} geojson={item.geojson} />}
        {refs?.pmtiles && (
          <PMTilesViewer pmtilesUrl={refs.pmtiles} geojson={item.geojson} />
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Metadata */}
        <div className="lg:col-span-2">
          <MetadataCard item={item} />
        </div>

        {/* Right column - Map and Downloads */}
        <div className="space-y-6">
          <LocationMap geojson={item.geojson} title={item.title} />
          {refs?.download && (
            <DownloadsCard download={refs.download} format={item.format} />
          )}
        </div>
      </div>
    </div>
  );
}
