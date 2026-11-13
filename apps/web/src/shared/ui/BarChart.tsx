export type BarSeries = {
  key: string;
  label: string;
  /** Tailwind background token class, e.g. `bg-primary`. */
  colorClass: string;
};

export type BarRow = {
  label: string;
  values: Readonly<Record<string, number | null>>;
};

/**
 * Minimal grouped bar chart. Bars are decorative (`aria-hidden`); the same
 * values are always available as a table behind a keyboard-operable
 * disclosure, and each series has a text legend (never colour-only).
 * `null` values are unavailable, rendered as "—", not as zero.
 */
export function BarChart({
  caption,
  series,
  rows,
  tableLabel,
  format = String,
}: {
  caption: string;
  series: readonly BarSeries[];
  rows: readonly BarRow[];
  tableLabel: string;
  format?: (value: number) => string;
}) {
  const max = Math.max(
    1,
    ...rows.flatMap((row) => series.map((s) => row.values[s.key] ?? 0)),
  );
  return (
    <figure className="m-0 grid min-w-0 gap-3">
      <figcaption className="text-h4">{caption}</figcaption>
      {series.length > 1 && (
        <ul className="m-0 flex list-none flex-wrap gap-3 p-0 text-small">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1">
              <span aria-hidden="true" className={`size-3 rounded-sm ${s.colorClass}`} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        aria-hidden="true"
        className="flex h-40 min-w-0 items-end gap-1 overflow-x-auto border-b border-border"
      >
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex h-full min-w-3 flex-1 items-end justify-center gap-px"
            title={`${row.label}: ${series.map((s) => `${s.label} ${row.values[s.key] ?? '—'}`).join(', ')}`}
          >
            {series.map((s) => {
              const value = row.values[s.key];
              return (
                <span
                  key={s.key}
                  className={`w-full max-w-6 rounded-t-sm ${value === null ? 'bg-border' : s.colorClass}`}
                  style={{ height: `${value === null ? 2 : Math.max(2, ((value ?? 0) / max) * 100)}%` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <details>
        <summary className="inline-flex min-h-touch cursor-pointer items-center underline">
          {tableLabel}
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr>
                <th scope="col" className="text-start" />
                {series.map((s) => (
                  <th key={s.key} scope="col" className="text-end">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <th scope="row" className="text-start font-normal">
                    {row.label}
                  </th>
                  {series.map((s) => {
                    const value = row.values[s.key];
                    return (
                      <td key={s.key} className="text-end">
                        {value === null || value === undefined ? '—' : format(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
