'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ProductPill } from '@apnatown/shared/products';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { failureCode } from '../../../shared/api/result';
import { Alert } from '../../businesses/parts';
import { productErrorKey } from './errors';
import { ProductIcon } from './icons';
import { useReplacePills } from './queries';
import { plainError, textOrNull } from './validation';
import type { BusinessKind } from '@apnatown/shared/businesses';

const LABEL_MAX = 40;

type Row = {
  subcategoryId: string;
  catalogNameEn: string;
  catalogNameHi: string;
  labelEn: string;
  labelHi: string;
  hidden: boolean;
};

const toRows = (pills: ProductPill[]): Row[] =>
  [...pills]
    .sort((a, b) => a.position - b.position)
    .map((pill) => ({
      subcategoryId: pill.subcategoryId,
      catalogNameEn: pill.catalogNameEn,
      catalogNameHi: pill.catalogNameHi,
      labelEn: pill.labelEn ?? '',
      labelHi: pill.labelHi ?? '',
      hidden: pill.hidden,
    }));

/**
 * "Manage category pills" sheet: reorder (buttons, keyboard-reachable), rename
 * per language (blank = catalogue name) and hide. Saving PUTs the whole list,
 * which replaces every saved preference. Taxonomy itself never changes here.
 */
export function PillManager({
  kind,
  pills,
  open,
  onClose,
  onSaved,
}: {
  kind: BusinessKind;
  pills: ProductPill[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('products.pills');
  const tv = useTranslations('products.validation');
  const te = useTranslations('products.errors');
  const locale = useLocale();
  const save = useReplacePills(kind);
  const [rows, setRows] = useState(() => toRows(pills));
  const [announce, setAnnounce] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const name = (row: Row) =>
    locale === 'hi' ? row.catalogNameHi : row.catalogNameEn;
  const errors = rows.map((row) => ({
    en: plainError(row.labelEn, LABEL_MAX, false),
    hi: plainError(row.labelHi, LABEL_MAX, false),
  }));
  const invalid = errors.some((error) => error.en || error.hi);

  function patch(index: number, next: Partial<Row>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...next } : row)),
    );
  }
  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row!);
    setRows(next);
    setAnnounce(
      t('moved', { name: name(row!), position: target + 1, total: rows.length }),
    );
    // Keep focus on the moved row's control (the clicked one may now be disabled).
    const edge = by === -1 ? target === 0 : target === rows.length - 1;
    const focus = `pill-${edge ? (by === -1 ? 'down' : 'up') : by === -1 ? 'up' : 'down'}-${row!.subcategoryId}`;
    window.requestAnimationFrame(() => document.getElementById(focus)?.focus());
  }
  function submit() {
    setSubmitted(true);
    if (invalid) return;
    void save.run(
      {
        items: rows.map((row, position) => ({
          subcategoryId: row.subcategoryId,
          position,
          labelEn: textOrNull(row.labelEn),
          labelHi: textOrNull(row.labelHi),
          hidden: row.hidden,
        })),
      },
      onSaved,
    );
  }

  const code = save.isError ? failureCode(save.error) : undefined;
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('title')}
      description={t('hint')}
      closeLabel={t('close')}
      wide
      busy={save.isPending}
      footer={
        <div className="grid w-full gap-2">
          {code && (
            <Alert tone="bad" role="alert">
              <p className="m-0">{te(productErrorKey(code))}</p>
            </Alert>
          )}
          <Button
            className="w-full"
            loading={save.isPending}
            disabled={rows.length === 0}
            onClick={submit}
          >
            {t('save')}
          </Button>
        </div>
      }
    >
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      {rows.length === 0 ? (
        <p className="m-0 text-small text-text-2">{t('empty')}</p>
      ) : (
        <ol className="m-0 grid list-none gap-3 p-0">
          {rows.map((row, index) => (
            <li
              key={row.subcategoryId}
              className="grid gap-2 rounded-md border border-border p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="me-auto min-w-0 font-semibold [overflow-wrap:anywhere]">
                  {index + 1}. {name(row)}
                </span>
                <Button
                  id={`pill-up-${row.subcategoryId}`}
                  size="small"
                  variant="ghost"
                  aria-label={t('moveUp', { name: name(row) })}
                  disabled={index === 0 || save.isPending}
                  onClick={() => move(index, -1)}
                >
                  <ProductIcon name="up" className="size-4" />
                </Button>
                <Button
                  id={`pill-down-${row.subcategoryId}`}
                  size="small"
                  variant="ghost"
                  aria-label={t('moveDown', { name: name(row) })}
                  disabled={index === rows.length - 1 || save.isPending}
                  onClick={() => move(index, 1)}
                >
                  <ProductIcon name="down" className="size-4" />
                </Button>
              </div>
              <div className="grid gap-2 tablet:grid-cols-2">
                <Input
                  label={t('renameEn')}
                  placeholder={row.catalogNameEn}
                  maxLength={LABEL_MAX}
                  value={row.labelEn}
                  lang="en"
                  error={submitted && errors[index]?.en ? tv(errors[index].en) : undefined}
                  onChange={(event) => patch(index, { labelEn: event.target.value })}
                />
                <Input
                  label={t('renameHi')}
                  placeholder={row.catalogNameHi}
                  maxLength={LABEL_MAX}
                  value={row.labelHi}
                  lang="hi"
                  error={submitted && errors[index]?.hi ? tv(errors[index].hi) : undefined}
                  onChange={(event) => patch(index, { labelHi: event.target.value })}
                />
              </div>
              <Checkbox
                label={t('hide')}
                description={t('hideHint')}
                checked={row.hidden}
                onChange={(event) => patch(index, { hidden: event.target.checked })}
              />
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
