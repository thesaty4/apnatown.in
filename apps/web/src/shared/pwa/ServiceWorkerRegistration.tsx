'use client';

import { useEffect } from 'react';

/**
 * Registers the shell service worker from production builds only: the worker
 * caches the static app shell and offline screen, never API or private data.
 * Development keeps no worker so HMR and fresh RSC reads are never masked.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline/install support stays unavailable; the app still works online.
    });
  }, []);
  return null;
}
