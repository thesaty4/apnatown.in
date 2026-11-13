'use client';

import { useEffect, useState } from 'react';

// Q-55: browser-local, never account-synced or included in an API request.
// The prototype retains six submitted terms; API/query caches are not persisted.
const storageKey = 'apnatown.search.recent.v1';
const limit = 6;
const empty: string[] = [];
let memory = empty;

function parse(raw: string | null): string[] {
  if (!raw || raw.length > 10_000) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return []; // Corrupt history is discarded, not reported as unavailable storage.
  }
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(
    (item): item is string =>
      typeof item === 'string' && item.trim().length > 0 && item.length <= 200,
  ).map((item) => item.trim()))].slice(0, limit);
}

export function useRecentSearches() {
  const [terms, setTerms] = useState(empty);
  const [temporary, setTemporary] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        memory = parse(window.localStorage.getItem(storageKey));
        setTemporary(false);
      } catch {
        // Restricted/quota-limited storage still permits this tab's history.
        setTemporary(true);
      }
      setTerms(memory);
    };
    read();
    const changed = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) read();
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  const remember = (input: string) => {
    const term = input.trim();
    if (!term || term.length > 200) return;
    memory = [term, ...memory.filter(
      (item) => item.toLowerCase() !== term.toLowerCase(),
    )].slice(0, limit);
    setTerms(memory);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(memory));
    } catch {
      setTemporary(true);
    }
  };
  const clear = () => {
    memory = empty;
    setTerms(memory);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      setTemporary(true);
    }
  };
  return { terms, temporary, remember, clear };
}
