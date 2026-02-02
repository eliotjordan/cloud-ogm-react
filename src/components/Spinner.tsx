/**
 * Simple spinner component for quick loading states
 * Used for search results, item details, and other transient loading states
 */
export function Spinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      {/* Spinner circle */}
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-600 dark:border-primary-400 rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* Loading message */}
      {message && (
        <p className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
