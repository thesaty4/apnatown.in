'use client';

import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import {
  Field,
  descriptionIds,
  fieldBorderClassName,
  fieldControlClassName,
  type FieldProps,
} from './Field.js';

export type InputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'prefix' | 'type' | 'children'
> &
  FieldProps & {
    type?:
      | 'text'
      | 'tel'
      | 'number'
      | 'email'
      | 'search'
      | 'date'
      | 'time'
      | 'url'
      | 'password';
    /** Non-interactive adornments, included in the accessible description. */
    prefix?: ReactNode;
    suffix?: ReactNode;
  };

/** Native value/defaultValue, validation and React 19 ref semantics are preserved. */
export function Input({
  id,
  label,
  hint,
  error,
  required,
  prefix,
  suffix,
  wrapperClassName,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isInvalid = error ? true : invalid;
  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      wrapperClassName={wrapperClassName}
    >
      <div className="flex min-w-0 items-stretch">
        {prefix != null && (
          <span
            id={`${inputId}-prefix`}
            className="grid min-w-0 place-items-center rounded-s-md border-2 border-e-0 border-border-strong bg-surface-2 px-3 font-semibold text-text [overflow-wrap:anywhere]"
          >
            {prefix}
          </span>
        )}
        <input
          type="text"
          {...props}
          id={inputId}
          required={required}
          aria-invalid={isInvalid}
          aria-describedby={descriptionIds(
            describedBy,
            hint ? `${inputId}-hint` : undefined,
            error ? `${inputId}-error` : undefined,
            prefix != null ? `${inputId}-prefix` : undefined,
            suffix != null ? `${inputId}-suffix` : undefined,
          )}
          className={`${fieldControlClassName} min-h-input-min-height read-only:bg-surface-2 ${fieldBorderClassName(isInvalid)} ${prefix != null ? 'rounded-s-none' : ''} ${suffix != null ? 'rounded-e-none' : ''} ${className}`}
        />
        {suffix != null && (
          <span
            id={`${inputId}-suffix`}
            className="grid min-w-0 place-items-center rounded-e-md border-2 border-s-0 border-border-strong bg-surface-2 px-3 font-semibold text-text [overflow-wrap:anywhere]"
          >
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}
