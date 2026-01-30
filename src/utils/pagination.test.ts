import { describe, it, expect } from 'vitest';
import { calculatePagination, getPaginationSql } from './pagination';

describe('calculatePagination', () => {
  it('should calculate pagination for first page', () => {
    const result = calculatePagination(1, 100, 25);
    expect(result).toEqual({
      currentPage: 1,
      totalPages: 4,
      totalResults: 100,
      pageSize: 25,
      startResult: 1,
      endResult: 25,
    });
  });

  it('should calculate pagination for middle page', () => {
    const result = calculatePagination(2, 100, 25);
    expect(result).toEqual({
      currentPage: 2,
      totalPages: 4,
      totalResults: 100,
      pageSize: 25,
      startResult: 26,
      endResult: 50,
    });
  });

  it('should calculate pagination for last page', () => {
    const result = calculatePagination(4, 100, 25);
    expect(result).toEqual({
      currentPage: 4,
      totalPages: 4,
      totalResults: 100,
      pageSize: 25,
      startResult: 76,
      endResult: 100,
    });
  });

  it('should handle partial last page', () => {
    const result = calculatePagination(3, 55, 25);
    expect(result).toEqual({
      currentPage: 3,
      totalPages: 3,
      totalResults: 55,
      pageSize: 25,
      startResult: 51,
      endResult: 55,
    });
  });

  it('should handle zero results', () => {
    const result = calculatePagination(1, 0, 25);
    expect(result).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalResults: 0,
      pageSize: 25,
      startResult: 0,
      endResult: 0,
    });
  });

  it('should clamp page to valid range', () => {
    const result = calculatePagination(10, 25, 25);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});

describe('getPaginationSql', () => {
  it('should calculate LIMIT and OFFSET for first page', () => {
    const result = getPaginationSql(1, 25);
    expect(result).toEqual({ limit: 25, offset: 0 });
  });

  it('should calculate LIMIT and OFFSET for second page', () => {
    const result = getPaginationSql(2, 25);
    expect(result).toEqual({ limit: 25, offset: 25 });
  });

  it('should calculate LIMIT and OFFSET for third page', () => {
    const result = getPaginationSql(3, 10);
    expect(result).toEqual({ limit: 10, offset: 20 });
  });
});
