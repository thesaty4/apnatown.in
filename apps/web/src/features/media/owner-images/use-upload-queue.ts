'use client';

import { useEffect, useRef, useState } from 'react';
import type { MediaUploadResult } from '@apnatown/shared';
import { useOwnerContext } from '../../businesses/queries';
import type { OwnerImagePolicy, OwnerImagePurpose } from './api';
import {
  finalIssues,
  issueForCode,
  precheck,
  type UploadIssue,
} from './issues';
import { useOwnerImageUpload } from './queries';

export type PendingUpload = {
  id: string;
  name: string;
  file: File;
  /** One Idempotency-Key per file intent, reused by every retry. */
  key: string;
  /** Local blob preview of the chosen file (CSP `img-src blob:`). */
  previewUrl: string;
  status: 'checking' | 'queued' | 'uploading' | 'failed';
  issue?: UploadIssue | undefined;
};

const isBusy = (items: readonly PendingUpload[]) =>
  items.some((item) => item.status !== 'failed');

/**
 * Serialized owner upload queue shared by the single and multi-image fields.
 * Files are pre-checked against the policy, then uploaded one at a time; a
 * failed file keeps its key so "Retry" replays rather than duplicates. All
 * transient state (files, blob URLs) is dropped on account/epoch change.
 */
export function useUploadQueue({
  purpose,
  businessId,
  onUploaded,
  onPendingChange,
}: {
  purpose: OwnerImagePurpose;
  businessId: string;
  onUploaded: (result: MediaUploadResult) => void;
  onPendingChange?: ((pending: boolean) => void) | undefined;
}) {
  const { lifecycle } = useOwnerContext();
  const { upload } = useOwnerImageUpload(purpose, businessId);
  const [items, setItems] = useState<PendingUpload[]>([]);
  const itemsRef = useRef<PendingUpload[]>([]);
  const running = useRef(false);
  const callbacks = useRef({ onUploaded, onPendingChange });
  useEffect(() => {
    callbacks.current = { onUploaded, onPendingChange };
  }, [onUploaded, onPendingChange]);

  function commit(next: PendingUpload[]) {
    const before = isBusy(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
    const after = isBusy(next);
    if (before !== after) callbacks.current.onPendingChange?.(after);
  }
  const patch = (id: string, change: Partial<PendingUpload>) =>
    commit(
      itemsRef.current.map((item) =>
        item.id === id ? { ...item, ...change } : item,
      ),
    );
  function drop(id: string) {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    commit(itemsRef.current.filter((entry) => entry.id !== id));
  }
  function clear() {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    commit([]);
  }

  // Release blob URLs on unmount; forget everything on account change.
  useEffect(() => {
    const unsubscribe = lifecycle.subscribe(clear);
    return () => {
      unsubscribe();
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      if (isBusy(itemsRef.current)) callbacks.current.onPendingChange?.(false);
      itemsRef.current = [];
    };
  }, [lifecycle]);

  async function drain() {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((item) => item.status === 'queued');
        if (!next) return;
        if (!navigator.onLine) {
          patch(next.id, { status: 'failed', issue: 'offline' });
          continue;
        }
        patch(next.id, { status: 'uploading', issue: undefined });
        const outcome = await upload(next.file, next.key);
        if (!itemsRef.current.some((item) => item.id === next.id)) continue;
        if (outcome.ok) {
          callbacks.current.onUploaded(outcome.result);
          drop(next.id);
        } else if (outcome.code === 'SESSION_CHANGED') {
          clear();
          return;
        } else {
          patch(next.id, {
            status: 'failed',
            issue: issueForCode(outcome.code, navigator.onLine),
          });
        }
      }
    } finally {
      running.current = false;
    }
  }

  /** Queues files; returns how many were refused for lack of capacity. */
  function add(files: File[], policy: OwnerImagePolicy, capacity: number) {
    const accepted = files.slice(0, Math.max(0, capacity));
    const created = accepted.map((file): PendingUpload => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      key: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      status: 'checking',
    }));
    commit([...itemsRef.current, ...created]);
    void Promise.all(
      created.map(async (item) => {
        const issue = await precheck(item.file, policy);
        if (!itemsRef.current.some((entry) => entry.id === item.id)) return;
        patch(
          item.id,
          issue ? { status: 'failed', issue } : { status: 'queued' },
        );
      }),
    ).then(drain);
    return files.length - accepted.length;
  }

  function retry(id: string) {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item || item.status !== 'failed') return;
    if (item.issue && finalIssues.has(item.issue)) return;
    patch(id, { status: 'queued', issue: undefined });
    void drain();
  }

  return {
    items,
    /** Uploads in flight or waiting (failed files excluded). */
    active: items.filter((item) => item.status !== 'failed').length,
    add,
    retry,
    remove: drop,
  };
}
