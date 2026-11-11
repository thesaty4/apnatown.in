'use client';

import { useId, type ComponentPropsWithRef } from 'react';
import {
  Field,
  descriptionIds,
  fieldBorderClassName,
  fieldControlClassName,
  type FieldProps,
} from './Field.js';

export type TextAreaProps = Omit<
  ComponentPropsWithRef<'textarea'>,
  'children'
> &
  FieldProps;

/** Prototype textarea.input: 96px minimum, vertically resizable, never fixed height. */
export function TextArea({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: TextAreaProps) {
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
      <textarea
        {...props}
        id={inputId}
        required={required}
        aria-invalid={isInvalid}
        aria-describedby={descriptionIds(
          describedBy,
          hint ? `${inputId}-hint` : undefined,
          error ? `${inputId}-error` : undefined,
        )}
        className={`${fieldControlClassName} min-h-textarea-min-height resize-y read-only:bg-surface-2 [overflow-wrap:anywhere] ${fieldBorderClassName(isInvalid)} ${className}`}
      />
    </Field>
  );
}
