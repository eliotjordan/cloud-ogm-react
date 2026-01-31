import { useState } from 'react';
import { useDuckDB } from '@/hooks/useDuckDB';
import { useRouter } from '@/hooks/useRouter';
import { QueryHistoryProvider } from '@/hooks/useQueryHistory';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { ItemDetail } from '@/pages/ItemDetail';

/**
 * Main application component
 * Handles DuckDB initialization and routing
 */
export function App() {
  const { conn, isLoading, error } = useDuckDB();
  const route = useRouter();
  const [queryTime, setQueryTime] = useState<number | null>(null);

  return (
    <QueryHistoryProvider>
      {/* Show loading screen during initialization */}
      {isLoading ? (
        <div className="min-h-screen flex flex-col">
          <Header queryTime={null} />
          <main className="flex-1">
            <LoadingSpinner />
          </main>
          <Footer />
        </div>
      ) : error || !conn ? (
        /* Show error if DuckDB initialization failed */
        <div className="min-h-screen flex flex-col">
          <Header queryTime={null} />
          <main className="flex-1">
            <ErrorMessage
              message={error || 'Failed to initialize database connection'}
            />
          </main>
          <Footer />
        </div>
      ) : (
        /* Render appropriate page based on route */
        <div className="min-h-screen flex flex-col">
          <Header queryTime={queryTime} />
          <main className="flex-1">
            {route.route === 'item' && route.params[0] ? (
              <ItemDetail
                itemId={route.params[0]}
                conn={conn}
                onQueryTime={setQueryTime}
              />
            ) : route.route === 'search' ? (
              <SearchPage conn={conn} query={route.query} onQueryTime={setQueryTime} />
            ) : (
              <HomePage conn={conn} onQueryTime={setQueryTime} />
            )}
          </main>
          <Footer />
        </div>
      )}
    </QueryHistoryProvider>
  );
}
