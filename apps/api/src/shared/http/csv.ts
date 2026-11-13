/**
 * Formula-safe CSV cell (shared CSV export rule): a cell starting with
 * `= + - @`, tab or CR is prefixed with `'` so spreadsheets treat it as text;
 * every cell is quoted with embedded quotes doubled.
 */
export function csvCell(value: string | null): string {
  const text = value ?? '';
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** One CRLF-terminated CSV record. */
export function csvRow(values: readonly (string | null)[]): string {
  return `${values.map(csvCell).join(',')}\r\n`;
}
