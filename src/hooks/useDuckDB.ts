import { useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { PARQUET_URL } from '@/lib/constants';

/**
 * Initialize DuckDB-WASM and create a connection to the Parquet file
 * This hook manages the DuckDB lifecycle and provides the connection to components
 */
export function useDuckDB() {
  const [conn, setConn] = useState<AsyncDuckDBConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeDuckDB() {
      try {
        // Select and load DuckDB bundle
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        // Create worker
        const workerUrl = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], {
            type: 'text/javascript',
          })
        );

        const worker = new Worker(workerUrl);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);

        // Instantiate database
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(workerUrl);

        // Create connection
        const connection = await db.connect();

        // Load extensions
        await connection.query('LOAD httpfs');
        await connection.query('LOAD spatial');

        // Tune HTTP settings for better performance with range requests
        await connection.query('SET http_keep_alive=true');
        await connection.query('SET http_retries=3');

        // Create view of Parquet file
        await connection.query(`
          CREATE VIEW parquet_data AS
          SELECT * FROM read_parquet('${PARQUET_URL}')
        `);

        if (mounted) {
          setConn(connection);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('DuckDB initialization error:', err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize database'
          );
          setIsLoading(false);
        }
      }
    }

    initializeDuckDB();

    return () => {
      mounted = false;
      // Cleanup connection if needed
      if (conn) {
        conn.close().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { conn, isLoading, error };
}
