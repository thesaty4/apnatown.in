const HOUR_MS = 60 * 60 * 1000;

/**
 * Rolling reporting periods from the final prototype (js10.js): day/today is
 * [asOf-24h, asOf), week is [asOf-7x24h, asOf). Half-open UTC instants; IST
 * is display-only. A calendar-day switch needs a product decision.
 */
export function rollingPeriod(
  asOf: Date,
  range: 'day' | 'week',
): { start: Date; end: Date } {
  const hours = range === 'day' ? 24 : 7 * 24;
  return { start: new Date(asOf.getTime() - hours * HOUR_MS), end: asOf };
}
