'use client';

import { useId, type ComponentPropsWithRef } from 'react';
import {
  Field,
  descriptionIds,
  fieldBorderClassName,
  fieldControlClassName,
  type FieldProps,
} from './Field.js';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children'> &
  FieldProps & {
    /** Supply a localized empty-value option when a placeholder is needed. */
    options: readonly SelectOption[];
  };

/** Native select on every viewport: platform picker, keyboard and form submission. */
export function Select({
  id,
  label,
  hint,
  error,
  required,
  options,
  wrapperClassName,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: SelectProps) {
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
      <select
        {...props}
        id={inputId}
        required={required}
        aria-invalid={isInvalid}
        aria-describedby={descriptionIds(
          describedBy,
          hint ? `${inputId}-hint` : undefined,
          error ? `${inputId}-error` : undefined,
        )}
        className={`${fieldControlClassName} min-h-input-min-height whitespace-normal ${fieldBorderClassName(isInvalid)} ${className}`}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
