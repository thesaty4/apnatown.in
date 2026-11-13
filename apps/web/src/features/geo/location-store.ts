'use client';

import { useSyncExternalStore } from 'react';
import {
  LocationResolutionSchema,
  type LocationResolution,
} from '@apnatown/shared/geo';
import type { DevicePosition } from './device-location';

/**
 * Browse-only location for the active app session (Q-34). The tab session
 * keeps only the server-resolved city/area/zone; precise device coordinates
 * stay in memory and are never written to storage, URLs or query keys. A
 * `revision` changes on every update so precise-location consumers can key
 * their reads without holding raw coordinates. Saving a location as an
 * address is a separate, explicit `users` action.
 */
export type BrowseLocation = {
  selection: LocationResolution | null;
  revision: number;
};

const storageKey = 'apnatown.browse-location';
const serverSnapshot: BrowseLocation = { selection: null, revision: 0 };
const listeners = new Set<() => void>();
let snapshot: BrowseLocation | undefined;
let precise: DevicePosition | null = null;

function load(): LocationResolution | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = LocationResolutionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function read() {
  snapshot ??= { selection: load(), revision: 0 };
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(selection: LocationResolution | null) {
  snapshot = { selection, revision: read().revision + 1 };
  try {
    if (selection)
      window.sessionStorage.setItem(storageKey, JSON.stringify(selection));
    else window.sessionStorage.removeItem(storageKey);
  } catch {
    // Storage unavailable (private mode/quota): memory state still applies.
  }
  listeners.forEach((listener) => listener());
}

/** `position` is kept only for a GPS resolution in this tab's memory. */
export function setBrowseLocation(
  selection: LocationResolution,
  position?: DevicePosition,
) {
  precise = selection.source === 'gps' && position ? position : null;
  publish(selection);
}

export function clearBrowseLocation() {
  precise = null;
  publish(null);
}

/** In-memory precise point for the current GPS selection, if any. */
export function preciseBrowseLocation(): DevicePosition | null {
  return precise;
}

export function useBrowseLocation() {
  return useSyncExternalStore(subscribe, read, () => serverSnapshot);
}
