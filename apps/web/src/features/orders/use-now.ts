'use client';

import { useEffect, useState } from 'react';

/** Wall clock for countdown-style UI (code expiry / reissue cooldown).
 * Display only: the server re-checks every deadline. */
export function useNow(intervalMs = 5_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
