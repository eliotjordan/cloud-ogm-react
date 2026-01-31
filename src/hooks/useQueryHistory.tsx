import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Individual query record
 */
export interface QueryRecord {
  id: string;
  label: string;
  sql: string;
  duration: number;
  timestamp: number;
}

/**
 * Query history context for tracking DuckDB queries
 */
interface QueryHistoryContextType {
  queries: QueryRecord[];
  totalTime: number;
  addQuery: (label: string, sql: string, duration: number) => void;
  clearQueries: () => void;
}

const QueryHistoryContext = createContext<QueryHistoryContextType | undefined>(
  undefined
);

/**
 * Provider component for query history
 */
export function QueryHistoryProvider({ children }: { children: ReactNode }) {
  const [queries, setQueries] = useState<QueryRecord[]>([]);

  const addQuery = (label: string, sql: string, duration: number) => {
    const query: QueryRecord = {
      id: `${Date.now()}-${Math.random()}`,
      label,
      sql: sql.trim(),
      duration,
      timestamp: Date.now(),
    };
    setQueries((prev) => [...prev, query]);
  };

  const clearQueries = () => {
    setQueries([]);
  };

  const totalTime = queries.reduce((sum, q) => sum + q.duration, 0);

  return (
    <QueryHistoryContext.Provider
      value={{ queries, totalTime, addQuery, clearQueries }}
    >
      {children}
    </QueryHistoryContext.Provider>
  );
}

/**
 * Hook to access query history
 */
export function useQueryHistory() {
  const context = useContext(QueryHistoryContext);
  if (!context) {
    throw new Error(
      'useQueryHistory must be used within QueryHistoryProvider'
    );
  }
  return context;
}
