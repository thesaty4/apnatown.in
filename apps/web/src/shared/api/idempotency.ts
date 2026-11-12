'use client';

import { useState } from 'react';

/** One key per logical command. Retrying the identical payload reuses its key so
 * the server replays instead of repeating; any changed payload is a new command. */
export function useIdempotencyKey() {
  const [keys] = useState(() => {
    let current: { fingerprint: string; key: string } | undefined;
    return {
      for(fingerprint: string) {
        if (current?.fingerprint !== fingerprint)
          current = { fingerprint, key: crypto.randomUUID() };
        return current.key;
      },
      clear() {
        current = undefined;
      },
    };
  });
  return keys;
}
