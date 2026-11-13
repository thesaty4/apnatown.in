'use client';

import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';

/** Step 2: shop vs provider (radio cards, prototype `.card` selected state). */
export function TypeStep({
  kind,
  onChoose,
  locked,
}: {
  kind: BusinessKind;
  onChoose: (kind: BusinessKind) => void;
  locked: boolean;
}) {
  const t = useTranslations('business.onboarding');
  return (
    <div className="grid gap-2">
      <div
        role="radiogroup"
        aria-label={t('steps.type')}
        className="grid gap-3 tablet:grid-cols-2"
      >
        {(['shop', 'provider'] as const).map((option) => {
          const selected = option === kind;
          return (
            <label
              key={option}
              className={`grid cursor-pointer justify-items-center gap-1 rounded-md border-2 p-4 text-center has-[:focus-visible]:ring-focus ${
                selected
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-surface'
              } ${locked && !selected ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="business-kind"
                value={option}
                checked={selected}
                disabled={locked && !selected}
                onChange={() => onChoose(option)}
                className="sr-only"
              />
              <span aria-hidden="true" className="text-h1">
                {option === 'shop' ? '🏪' : '🔧'}
              </span>
              <span className="font-semibold">
                {t(option === 'shop' ? 'typeShop' : 'typeProvider')}
              </span>
              <span className="text-small text-text-2">
                {t(option === 'shop' ? 'typeShopHint' : 'typeProviderHint')}
              </span>
              {selected && (
                <span className="text-caption font-semibold text-primary">
                  <span aria-hidden="true">✓ </span>
                  {t('selected')}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {locked && (
        <p className="m-0 text-small text-text-2">{t('typeLocked')}</p>
      )}
    </div>
  );
}
