'use client';

import { useTranslations } from 'next-intl';
import type { SuggestionStatus } from '@apnatown/shared/catalog';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';

const status: Record<SuggestionStatus, { tone: BadgeTone; icon: string }> = {
  pending: { tone: 'ap-pending', icon: '⏳' },
  approved: { tone: 'ap-approved', icon: '✓' },
  rejected: { tone: 'ap-rejected', icon: '✕' },
  merged: { tone: 'info', icon: '🔀' },
};

/** Status is always icon + text, never colour alone. */
export function SuggestionStatusBadge({ value }: { value: SuggestionStatus }) {
  const t = useTranslations('catalog.subcategorySuggestion.status');
  return (
    <StatusBadge
      tone={status[value].tone}
      icon={status[value].icon}
      label={t(value)}
    />
  );
}

const ownerErrors: Record<string, string> = {
  SUGGESTION_DUPLICATE: 'duplicate',
  SUGGESTION_SIMILARITY_WARNING: 'similar',
  CATEGORY_NOT_FOUND: 'categoryMissing',
  COMMON_FORBIDDEN: 'forbidden',
  FORBIDDEN: 'forbidden',
  SUGGESTION_SCOPE_DENIED: 'forbidden',
  COMMON_RATE_LIMITED: 'rateLimited',
  RATE_LIMITED: 'rateLimited',
  VALIDATION_ERROR: 'validation',
  COMMON_VALIDATION_FAILED: 'validation',
  SESSION_EXPIRED: 'expired',
  MAINTENANCE: 'maintenance',
};
/** `catalog.subcategorySuggestion.errors` key; never server text. */
export const ownerErrorKey = (code: string) => ownerErrors[code] ?? 'failed';
export const isOwnerDenied = (code: string) =>
  ownerErrorKey(code) === 'forbidden';
