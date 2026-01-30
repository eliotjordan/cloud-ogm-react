/**
 * Error message component for displaying user-friendly error messages
 */
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      role="alert"
    >
      <div className="flex items-start">
        <svg
          className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Error
          </h3>
          <p className="mt-1 text-red-700 dark:text-red-300">{message}</p>
        </div>
      </div>
    </div>
  );
}
