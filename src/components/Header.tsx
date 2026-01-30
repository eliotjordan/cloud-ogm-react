import { navigate } from '@/lib/router';

/**
 * Application header with title and optional query time display
 */
export function Header({ queryTime }: { queryTime: number | null }) {
  return (
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
          <div
            className="flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-700 rounded-lg text-sm"
            aria-live="polite"
          >
            <span className="text-gray-700 dark:text-gray-300 font-semibold">
              Query Time:
            </span>
            <span className="text-primary-700 dark:text-primary-300 font-bold tabular-nums">
              {queryTime.toFixed(0)}ms
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
