'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { NavIcon } from '../../shared/ui/NavIcon';

export type ProductVariant = { id: string; label: string };

/**
 * Required single-choice variant selector as radio chips. Native radios give
 * arrow-key navigation within the group; the selected chip adds a check icon
 * and a heavier border, so selection never relies on colour alone.
 */
export function VariantPicker({
  variants,
  value,
  onChange,
  showRequired,
  disabled,
}: {
  variants: readonly ProductVariant[];
  value: string | null;
  onChange: (variantId: string) => void;
  /** Show the inline "choose an option" guidance (after a blocked add). */
  showRequired: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations('cart.add');
  const name = useId();
  const hintId = `${name}-hint`;
  const missing = showRequired && value === null;
  return (
    <fieldset
      className="m-0 grid min-w-0 gap-2 border-0 p-0"
      aria-describedby={missing ? hintId : undefined}
      disabled={disabled}
    >
      <legend className="mb-2 p-0 text-small font-semibold text-text">
        {t('variantLabel')}
        <span aria-hidden="true"> *</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const selected = value === variant.id;
          return (
            <label
              key={variant.id}
              className={`relative inline-flex min-h-touch max-w-full cursor-pointer items-center gap-2 rounded-pill px-4 text-small has-[:focus-visible]:ring-focus has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
                selected
                  ? 'border-2 border-primary bg-primary-soft font-semibold text-text'
                  : 'border border-border-strong bg-surface text-text'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={variant.id}
                checked={selected}
                required
                aria-invalid={missing || undefined}
                onChange={() => onChange(variant.id)}
                className="absolute inset-0 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              {selected && <NavIcon name="check" className="size-4 shrink-0" />}
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {variant.label}
              </span>
            </label>
          );
        })}
      </div>
      {missing && (
        <p
          id={hintId}
          role="alert"
          className="m-0 flex items-start gap-2 text-small text-text"
        >
          <NavIcon name="alert" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {t('variantRequired')}
          </span>
        </p>
      )}
    </fieldset>
  );
}
