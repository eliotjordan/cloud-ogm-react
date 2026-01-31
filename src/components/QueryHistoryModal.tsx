import { useQueryHistory } from '@/hooks/useQueryHistory';

interface QueryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal displaying DuckDB query history and execution times
 */
export function QueryHistoryModal({ isOpen, onClose }: QueryHistoryModalProps) {
  const { queries, totalTime } = useQueryHistory();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="query-modal-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2
              id="query-modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              DuckDB Query History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {queries.length} {queries.length === 1 ? 'query' : 'queries'} •
              Total time: {totalTime.toFixed(0)}ms
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Query List */}
        <div className="flex-1 overflow-y-auto p-6">
          {queries.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No queries executed yet
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((query, index) => (
                <div
                  key={query.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  {/* Query Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {query.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {query.duration.toFixed(1)}ms
                      </span>
                      <div
                        className="h-2 rounded-full bg-primary-200 dark:bg-primary-800"
                        style={{
                          width: `${Math.min((query.duration / totalTime) * 200, 100)}px`,
                        }}
                      />
                    </div>
                  </div>

                  {/* SQL Query */}
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <code className="text-gray-800 dark:text-gray-200">
                      {query.sql}
                    </code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
