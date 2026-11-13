'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@apnatown/ui/primitives/Input';
import { distributeCode } from './otp';

/** Feature-local composition of Input, not another shared field implementation. */
export function OtpInput({
  digits,
  onChange,
  disabled,
  invalid,
}: {
  digits: string[];
  onChange: (digits: string[]) => void;
  disabled: boolean;
  invalid: boolean;
}) {
  const t = useTranslations('auth.login');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);
  useEffect(() => {
    if (invalid && !disabled) inputs.current[0]?.focus();
  }, [invalid, disabled]);
  function enter(value: string, index: number) {
    const next = distributeCode(digits, value, index);
    onChange(next.digits);
    inputs.current[next.focus]?.focus();
    inputs.current[next.focus]?.select();
  }
  return (
    <fieldset disabled={disabled} className="-mx-2 min-w-0 tablet:mx-0">
      <legend className="mb-2 font-semibold">{t('codeLabel')}</legend>
      <div className="grid grid-cols-6 gap-1" dir="ltr">
        {digits.map((digit, index) => (
          <Input
            key={index}
            label={t('digit', { number: index + 1 })}
            wrapperClassName="[&>label]:sr-only"
            ref={(element) => {
              inputs.current[index] = element;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            pattern="[0-9]*"
            aria-invalid={invalid}
            className="px-0 text-center font-semibold"
            onFocus={(event) => event.target.select()}
            onChange={(event) => enter(event.target.value, index)}
            onPaste={(event) => {
              event.preventDefault();
              enter(event.clipboardData.getData('text'), index);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                inputs.current[
                  Math.max(
                    0,
                    Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1)),
                  )
                ]?.focus();
              }
              if (event.key === 'Backspace' && !digit && index > 0) {
                event.preventDefault();
                const next = [...digits];
                next[index - 1] = '';
                onChange(next);
                inputs.current[index - 1]?.focus();
              }
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}
