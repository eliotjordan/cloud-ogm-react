import type { Table } from 'apache-arrow';

/**
 * Parse all rows from a DuckDB query result into typed objects.
 * Handles the Arrow-to-JS-object conversion that DuckDB-WASM returns.
 */
export function parseResultRows<T>(result: Table): T[] {
  const records: T[] = [];
  for (let i = 0; i < result.numRows; i++) {
    const record: Record<string, unknown> = {};
    result.schema.fields.forEach((field, idx) => {
      record[field.name] = result.getChildAt(idx)?.get(i);
    });
    records.push(record as T);
  }
  return records;
}

/**
 * Parse a single row from a DuckDB query result into a typed object.
 * Returns null if the result has no rows.
 */
export function parseResultRow<T>(result: Table): T | null {
  if (result.numRows === 0) return null;

  const record: Record<string, unknown> = {};
  result.schema.fields.forEach((field, idx) => {
    record[field.name] = result.getChildAt(idx)?.get(0);
  });
  return record as T;
}
