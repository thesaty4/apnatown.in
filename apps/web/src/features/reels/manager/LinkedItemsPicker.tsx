'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MediaLinkTarget } from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { linkKey, useLinkTargets, type LinkOption } from './gallery-queries';

const MAX_LINKS = 10;

/**
 * Pick the owner's own published products / active services (max 10, or
 * `single` for a Gallery photo). Already-linked items that are no longer
 * public stay listed so they can be removed; the server re-validates.
 */
export function LinkedItemsPicker({
  kind,
  value,
  onChange,
  disabled,
  error,
  single = false,
}: {
  kind: BusinessKind;
  value: readonly MediaLinkTarget[];
  onChange: (next: MediaLinkTarget[]) => void;
  disabled: boolean;
  error?: string | undefined;
  single?: boolean;
}) {
  const t = useTranslations('vendor.media.links');
  const targets = useLinkTargets(kind);
  const [search, setSearch] = useState('');
  const legendId = useId();
  const errorId = useId();
  const selected = useMemo(() => new Set(value.map(linkKey)), [value]);
  const max = single ? 1 : MAX_LINKS;
  const needle = search.trim().toLocaleLowerCase();
  const visible = [...targets.options.values()].filter(
    (option) =>
      (option.linkable || selected.has(linkKey(option))) &&
      (!needle || option.name.toLocaleLowerCase().includes(needle)),
  );
  const unknown = value.filter((link) => !targets.options.has(linkKey(link)));

  function toggle(option: MediaLinkTarget, on: boolean) {
    const target = { targetType: option.targetType, targetId: option.targetId };
    if (single) return onChange(on ? [target] : []);
    onChange(
      on
        ? [...value, target]
        : value.filter((link) => linkKey(link) !== linkKey(option)),
    );
  }

  const group = (type: LinkOption['targetType']) => {
    const rows = visible.filter((option) => option.targetType === type);
    if (rows.length === 0) return null;
    return (
      <div className="grid gap-1">
        <p className="m-0 text-caption-min font-semibold uppercase text-text-2">
          {t(type === 'product' ? 'products' : 'services')}
        </p>
        {rows.map((option) => {
          const key = linkKey(option);
          const on = selected.has(key);
          const full = !single && !on && value.length >= max;
          return (
            <div key={key} className="flex min-w-0 flex-wrap items-center gap-2">
              <Checkbox
                wrapperClassName="min-w-0 flex-1"
                label={option.name}
                checked={on}
                disabled={disabled || full || (!on && !option.linkable)}
                onChange={(event) => toggle(option, event.currentTarget.checked)}
              />
              {!option.linkable && (
                <Badge tone="warn" icon="⚠" label={t('notPublic')} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <fieldset
      aria-labelledby={legendId}
      aria-describedby={error ? errorId : undefined}
      className="m-0 grid min-w-0 gap-3 border-0 p-0"
    >
      <div className="grid gap-0.5">
        <p id={legendId} className="m-0 text-field-label font-semibold">
          {t(single ? 'titleSingle' : 'title')}
        </p>
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {single ? t('hintSingle') : t('hint', { count: value.length, max })}
        </p>
      </div>
      {targets.loading ? (
        <Skeleton label={t('loading')} />
      ) : targets.failed ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-small">
          <span className="text-error">{t('error')}</span>
          <Button size="card" variant="outline" onClick={targets.retry}>
            {t('retry')}
          </Button>
        </div>
      ) : targets.options.size === 0 ? (
        <p className="m-0 text-small text-text-2">{t('empty')}</p>
      ) : (
        <>
          <Input
            type="search"
            label={t('search')}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <div className="grid max-h-72 gap-3 overflow-y-auto rounded-md border border-border p-2">
            {group('product')}
            {group('service')}
            {visible.length === 0 && (
              <p className="m-0 text-small text-text-2">{t('noMatch')}</p>
            )}
          </div>
          {targets.hasMore && (
            <Button
              size="card"
              variant="ghost"
              loading={targets.loadingMore}
              onClick={targets.loadMore}
            >
              {t('loadMore')}
            </Button>
          )}
        </>
      )}
      {unknown.length > 0 && !targets.loading && (
        <div className="flex flex-wrap gap-2">
          {unknown.map((link) => (
            <Button
              key={linkKey(link)}
              size="card"
              variant="ghost"
              disabled={disabled}
              onClick={() => toggle(link, false)}
            >
              {t('removeUnknown', { type: link.targetType })}
            </Button>
          ))}
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="m-0 text-field-error text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
