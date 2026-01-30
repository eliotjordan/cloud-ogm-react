import type { PaginationInfo } from '@/types';
import { updateSearchParams } from '@/lib/router';

interface PaginationProps {
  pagination: PaginationInfo;
}

/**
 * Pagination controls for navigating search results
 */
export function Pagination({ pagination }: PaginationProps) {
  const { currentPage, totalPages } = pagination;

  function handlePrevious() {
    if (currentPage > 1) {
      updateSearchParams({ page: currentPage - 1 });
    }
  }

  function handleNext() {
    if (currentPage < totalPages) {
      updateSearchParams({ page: currentPage + 1 });
    }
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="btn-secondary disabled:opacity-50"
        aria-label="Previous page"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <span className="text-gray-700 dark:text-gray-300 font-medium tabular-nums">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="btn-secondary disabled:opacity-50"
        aria-label="Next page"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
