/**
 * Loading spinner component with animated SVG
 * Used during DuckDB initialization and data loading
 */
export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="mb-6">
        <svg
          className="w-20 h-20 animate-spin-slow"
          viewBox="0 0 50 50"
          aria-label="Loading"
        >
          <circle
            className="stroke-primary-600 animate-spin-dash"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-primary-600 mb-2">
        {message || 'Loading OpenGeoMetadata'}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Preparing your search experience...
      </p>
    </div>
  );
}
