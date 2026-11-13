'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Separate, ephemeral histories. Sharing restoration mechanics never shares
// filters or API results between Explore and Search.
const histories = {
  explore: new Map<string, number>(),
  search: new Map<string, number>(),
};

export function useExploreScroll(
  ready: boolean,
  scope: keyof typeof histories = 'explore',
) {
  const pathname = usePathname();
  const params = useSearchParams();
  const url = `${pathname}?${params}`;
  useEffect(() => {
    if (!ready) return;
    const positions = histories[scope];
    const position = positions.get(url);
    if (position !== undefined)
      window.scrollTo({ top: position, behavior: 'instant' });
    const remember = () => {
      positions.delete(url);
      positions.set(url, window.scrollY);
      if (positions.size > 50) {
        const oldest = positions.keys().next().value;
        if (oldest !== undefined) positions.delete(oldest);
      }
    };
    remember();
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [url, ready, scope]);
}
