import { useState } from 'react';
import { navigate } from '@/lib/router';
import { QueryHistoryModal } from '@/components/QueryHistoryModal';

/**
 * Application header with title and optional query time display
 */
export function Header({ queryTime }: { queryTime: number | null }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="bg-primary-50 dark:bg-primary-950 border-b border-primary-200 dark:border-primary-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-semibold text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 -ml-2"
          aria-label="Go to home page"
        >
          Cloud OpenGeoMetadata
        </button>

        {queryTime !== null && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-700 rounded-lg text-sm hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-live="polite"
            aria-label="View query history"
          >
            <span className="text-gray-700 dark:text-gray-300 font-semibold">
              Query Time:
            </span>
            <span className="text-primary-700 dark:text-primary-300 font-bold tabular-nums">
              {queryTime.toFixed(0)}ms
            </span>
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
      </div>
      </header>

      <QueryHistoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
