import type { PaginationInfo } from '@/types';
import { PAGE_SIZE } from '@/lib/constants';

/**
 * Calculate pagination information
 */
export function calculatePagination(
  currentPage: number,
  totalResults: number,
  pageSize: number = PAGE_SIZE
): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startResult = totalResults > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const endResult = Math.min(safePage * pageSize, totalResults);

  return {
    currentPage: safePage,
    totalPages,
    totalResults,
    pageSize,
    startResult,
    endResult,
  };
}

/**
 * Get SQL LIMIT and OFFSET for pagination
 */
export function getPaginationSql(
  page: number,
  pageSize: number = PAGE_SIZE
): { limit: number; offset: number } {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}
