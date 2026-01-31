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

  // Show loading screen during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header queryTime={null} />
        <main className="flex-1">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  // Show error if DuckDB initialization failed
  if (error || !conn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header queryTime={null} />
        <main className="flex-1">
          <ErrorMessage
            message={error || 'Failed to initialize database connection'}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Render appropriate page based on route
  let page;
  if (route.route === 'item' && route.params[0]) {
    page = (
      <ItemDetail
        itemId={route.params[0]}
        conn={conn}
        onQueryTime={setQueryTime}
      />
    );
  } else if (route.route === 'search') {
    page = (
      <SearchPage conn={conn} query={route.query} onQueryTime={setQueryTime} />
    );
  } else {
    page = <HomePage conn={conn} onQueryTime={setQueryTime} />;
  }

  return (
    <QueryHistoryProvider>
      <div className="min-h-screen flex flex-col">
        <Header queryTime={queryTime} />
        <main className="flex-1">{page}</main>
        <Footer />
      </div>
    </QueryHistoryProvider>
  );
}
