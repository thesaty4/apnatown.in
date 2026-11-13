'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  AdminListingQuerySchema,
  type AdminListingStatus,
} from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { statusKey } from '../approvals/parts';
import { LISTING_STATUSES, type ListingFilters } from './filters';

/** h1 + disabled "+ Add": admin creation is blocked by ADM-Q1, so the button
 * is never wired to `POST /admin/listings`; its reason is the description. */
export function ListingsHeader() {
  const t = useTranslations('admin.listings');
  const reasonId = useId();
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-h1 desktop:text-h1-desktop">
          {t('title')}
        </h1>
        <Button disabled aria-describedby={reasonId}>
          <span aria-hidden="true">+</span> {t('add')}
        </Button>
      </div>
      <p id={reasonId} className="m-0 text-small text-text-2">
        {t('addBlocked')}
      </p>
    </div>
  );
}

/** Search commits on submit (not per keystroke) and status changes push a
 * new URL, so Back restores the previous filter set. */
export function ListingsToolbar({
  filters,
  onChange,
}: {
  filters: ListingFilters;
  onChange: (next: ListingFilters) => void;
}) {
  const t = useTranslations('admin.listings');
  const ta = useTranslations('admin.approvals.status');
  const [text, setText] = useState(filters.q ?? '');
  const [invalid, setInvalid] = useState(false);
  const [lastQ, setLastQ] = useState(filters.q);
  if (lastQ !== filters.q) {
    // URL changed (Back/Forward or tab switch): mirror it in the field.
    setLastQ(filters.q);
    setText(filters.q ?? '');
    setInvalid(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = text.trim();
    const parsed = AdminListingQuerySchema.shape.q.safeParse(q || undefined);
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange({ ...filters, q: parsed.data, reportId: undefined });
  }

  const statusOptions = [
    { value: '', label: t('allStatuses') },
    ...LISTING_STATUSES.map((status) => ({
      value: status,
      label: ta(statusKey[status]),
    })),
  ];

  return (
    <div className="grid gap-3 tablet:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] tablet:items-end">
      <form
        role="search"
        aria-label={t('searchLabel')}
        className="flex min-w-0 items-end gap-2"
        onSubmit={submit}
      >
        <Input
          type="search"
          label={t('searchLabel')}
          hint={t('searchHint')}
          error={invalid ? t('searchInvalid') : undefined}
          aria-invalid={invalid || undefined}
          value={text}
          maxLength={80}
          wrapperClassName="min-w-0 flex-1"
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" variant="outline">
          {t('search')}
        </Button>
      </form>
      <Select
        label={t('statusLabel')}
        options={statusOptions}
        value={filters.status ?? ''}
        onChange={(event) =>
          onChange({
            ...filters,
            status: (event.target.value || undefined) as
              AdminListingStatus | undefined,
            reportId: undefined,
          })
        }
      />
    </div>
  );
}
