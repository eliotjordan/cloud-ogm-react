import { describe, it, expect } from 'vitest';
import { parseResultRows, parseResultRow } from './duckdb';

/**
 * Build a minimal mock Arrow Table matching DuckDB-WASM's result interface.
 */
function mockTable(fieldNames: string[], rows: unknown[][]) {
  const columns = fieldNames.map((_, colIdx) => ({
    get: (rowIdx: number) => rows[rowIdx]?.[colIdx],
  }));

  return {
    numRows: rows.length,
    schema: {
      fields: fieldNames.map((name) => ({ name })),
    },
    getChildAt: (idx: number) => columns[idx] ?? null,
  } as Parameters<typeof parseResultRows>[0];
}

interface TestRecord {
  id: string;
  title: string;
  count: number;
}

describe('parseResultRows', () => {
  it('should parse multiple rows into typed objects', () => {
    const table = mockTable(['id', 'title', 'count'], [
      ['a', 'Alpha', 10],
      ['b', 'Beta', 20],
    ]);

    const rows = parseResultRows<TestRecord>(table);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ id: 'a', title: 'Alpha', count: 10 });
    expect(rows[1]).toEqual({ id: 'b', title: 'Beta', count: 20 });
  });

  it('should return an empty array for zero rows', () => {
    const table = mockTable(['id', 'title'], []);

    const rows = parseResultRows<TestRecord>(table);

    expect(rows).toEqual([]);
  });

  it('should handle null column values', () => {
    const table = mockTable(['id', 'title'], [
      ['a', null],
    ]);

    const rows = parseResultRows<{ id: string; title: string | null }>(table);

    expect(rows[0].title).toBeNull();
  });
});

describe('parseResultRow', () => {
  it('should parse a single row', () => {
    const table = mockTable(['id', 'title'], [
      ['a', 'Alpha'],
    ]);

    const row = parseResultRow<{ id: string; title: string }>(table);

    expect(row).toEqual({ id: 'a', title: 'Alpha' });
  });

  it('should return null for empty result', () => {
    const table = mockTable(['id', 'title'], []);

    const row = parseResultRow<{ id: string; title: string }>(table);

    expect(row).toBeNull();
  });

  it('should return only the first row when multiple exist', () => {
    const table = mockTable(['id'], [
      ['first'],
      ['second'],
    ]);

    const row = parseResultRow<{ id: string }>(table);

    expect(row).toEqual({ id: 'first' });
  });
});
