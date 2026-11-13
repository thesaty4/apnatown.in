'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  OFFER_DISCOUNT_TYPES,
  OfferCreateSchema,
  type OfferDiscountType,
  type OwnerOffer,
} from '@apnatown/shared/offers';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { failureCode } from '../../../shared/api/result';
import { errorKey } from '../../businesses/parts';
import { DISCOUNT_TYPE_KEY } from './api';
import { useOfferCommand } from './queries';

const IST_OFFSET_MS = 330 * 60 * 1000;
/** ISO instant → IST calendar date for a date input. */
const istDate = (iso: string) => new Date(Date.parse(iso) + IST_OFFSET_MS).toISOString().slice(0, 10);
/** IST calendar date → start / end of that IST day as an ISO instant. */
const istStart = (date: string) => new Date(`${date}T00:00:00.000+05:30`).toISOString();
const istEnd = (date: string) => new Date(`${date}T23:59:59.999+05:30`).toISOString();

type Draft = {
  titleEn: string;
  titleHi: string;
  discountType: OfferDiscountType;
  value: string;
  from: string;
  to: string;
};

function initial(offer: OwnerOffer | null): Draft {
  if (!offer) {
    const today = istDate(new Date().toISOString());
    return { titleEn: '', titleHi: '', discountType: 'percent', value: '', from: today, to: today };
  }
  return {
    titleEn: offer.titleEn,
    titleHi: offer.titleHi ?? '',
    discountType: offer.discountType,
    value:
      offer.discountType === 'percent'
        ? String(offer.discountPercent ?? '')
        : offer.discountType === 'flat'
          ? String((offer.discountPaise ?? 0) / 100)
          : '',
    from: istDate(offer.validFrom),
    to: istDate(offer.validTo),
  };
}

/** Create / edit sheet. Saving always (re)enters pending approval. */
export function OfferEditorSheet({
  kind,
  offer,
  open,
  onClose,
}: {
  kind: BusinessKind;
  /** null = create. */
  offer: OwnerOffer | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('offers.owner');
  const te = useTranslations('business.errors');
  const formId = useId();
  const mutation = useOfferCommand(kind);
  const [draft, setDraft] = useState(() => initial(offer));
  const [invalid, setInvalid] = useState<readonly string[]>([]);
  const busy = mutation.isPending;
  const set = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setInvalid([]);
  };
  const close = () => {
    if (busy) return;
    mutation.reset();
    onClose();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(draft.value);
    const body = {
      titleEn: draft.titleEn.trim(),
      titleHi: draft.titleHi.trim() || null,
      discountType: draft.discountType,
      discountPercent: draft.discountType === 'percent' ? amount : null,
      discountPaise: draft.discountType === 'flat' ? Math.round(amount * 100) : null,
      validFrom: draft.from ? istStart(draft.from) : '',
      validTo: draft.to ? istEnd(draft.to) : '',
    };
    const parsed = OfferCreateSchema.safeParse(body);
    if (!parsed.success) {
      setInvalid(parsed.error.issues.map((issue) => String(issue.path[0])));
      return;
    }
    mutation.reset();
    void mutation.run(
      offer
        ? { type: 'update', id: offer.id, offer: parsed.data, expectedVersion: offer.version }
        : { type: 'create', offer: parsed.data },
      onClose,
    );
  };
  const valueInvalid = ['discountPercent', 'discountPaise', 'discountType'].some((field) =>
    invalid.includes(field),
  );
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={t(offer ? 'editTitle' : 'createTitle')}
      description={t('approvalNote')}
      closeLabel={t('cancel')}
      busy={busy}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={close}>
            {t('cancel')}
          </Button>
          <Button type="submit" form={formId} loading={busy}>
            {t('submit')}
          </Button>
        </div>
      }
    >
      <form id={formId} noValidate className="grid gap-3" onSubmit={submit}>
        <Input
          label={t('titleEn')}
          value={draft.titleEn}
          maxLength={80}
          required
          disabled={busy}
          error={invalid.includes('titleEn') ? t('titleRequired') : undefined}
          onChange={(event) => set({ titleEn: event.target.value })}
        />
        <Input
          label={t('titleHi')}
          value={draft.titleHi}
          maxLength={80}
          disabled={busy}
          onChange={(event) => set({ titleHi: event.target.value })}
        />
        <Select
          label={t('discountType')}
          value={draft.discountType}
          disabled={busy}
          options={OFFER_DISCOUNT_TYPES.map((type) => ({ value: type, label: t(`types.${DISCOUNT_TYPE_KEY[type]}`) }))}
          onChange={(event) =>
            set({ discountType: event.target.value as OfferDiscountType, value: '' })
          }
        />
        {draft.discountType !== 'free_delivery' && (
          <Input
            label={t(draft.discountType === 'percent' ? 'percentLabel' : 'amountLabel')}
            value={draft.value}
            inputMode={draft.discountType === 'percent' ? 'numeric' : 'decimal'}
            required
            disabled={busy}
            error={valueInvalid ? t(draft.discountType === 'percent' ? 'percentInvalid' : 'amountInvalid') : undefined}
            onChange={(event) => set({ value: event.target.value })}
          />
        )}
        <div className="grid gap-3 tablet:grid-cols-2">
          <Input
            label={t('validFrom')}
            type="date"
            value={draft.from}
            required
            disabled={busy}
            error={invalid.includes('validFrom') ? t('dateInvalid') : undefined}
            onChange={(event) => set({ from: event.target.value })}
          />
          <Input
            label={t('validTo')}
            type="date"
            value={draft.to}
            required
            disabled={busy}
            error={invalid.includes('validTo') ? t('dateInvalid') : undefined}
            onChange={(event) => set({ to: event.target.value })}
          />
        </div>
        {mutation.isError && (
          <p role="alert" className="m-0 text-small text-error">
            {te(errorKey(failureCode(mutation.error)))}
          </p>
        )}
      </form>
    </Sheet>
  );
}
