'use client';

import { useId, type ComponentPropsWithRef } from 'react';
import { descriptionIds, FieldFeedback } from './Field.js';

export type SelectionProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children' | 'size' | 'readOnly'
> & {
  label: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
};

function SelectionControl({
  id,
  label,
  description,
  error,
  wrapperClassName = '',
  className = '',
  kind,
  disabled,
  required,
  'aria-describedby': describedBy,
  'aria-labelledby': labelledBy,
  'aria-invalid': invalid,
  ...props
}: SelectionProps & { kind: 'checkbox' | 'radio' | 'switch' }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isSwitch = kind === 'switch';
  return (
    <div className={`grid min-w-0 gap-field-gap ${wrapperClassName}`}>
      <label
        htmlFor={inputId}
        className={`flex min-h-touch min-w-0 items-center gap-selection-gap ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <span
          className={
            isSwitch
              ? 'relative order-last ms-auto h-switch-height w-switch-width shrink-0'
              : 'contents'
          }
        >
          <input
            {...props}
            id={inputId}
            type={kind === 'radio' ? 'radio' : 'checkbox'}
            role={isSwitch ? 'switch' : undefined}
            disabled={disabled}
            required={required}
            aria-labelledby={labelledBy ?? `${inputId}-label`}
            aria-describedby={descriptionIds(
              describedBy,
              description ? `${inputId}-hint` : undefined,
              error ? `${inputId}-error` : undefined,
            )}
            aria-invalid={error ? true : invalid}
            className={`${isSwitch ? 'peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed' : 'm-0 size-selection-control shrink-0 accent-primary focus-visible:ring-focus aria-invalid:outline aria-invalid:outline-error disabled:cursor-not-allowed'} ${className}`}
          />
          {isSwitch && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-pill bg-border-strong transition-colors duration-2 ease-standard peer-checked:bg-secondary peer-checked:[&>span]:translate-x-switch-travel rtl:peer-checked:[&>span]:-translate-x-switch-travel peer-focus-visible:ring-focus peer-aria-invalid:outline peer-aria-invalid:outline-error motion-reduce:transition-none"
            >
              <span className="absolute start-switch-inset top-switch-inset size-6 rounded-pill bg-switch-thumb shadow-1 transition-transform duration-2 ease-standard motion-reduce:transition-none" />
            </span>
          )}
        </span>
        <span className="grid min-w-0 flex-1 gap-1">
          <span
            id={`${inputId}-label`}
            className="text-body text-text [overflow-wrap:anywhere]"
          >
            {label}
            {required && <span aria-hidden="true"> *</span>}
          </span>
          {description && (
            <span
              id={`${inputId}-hint`}
              className="text-small-min text-muted [overflow-wrap:anywhere]"
            >
              {description}
            </span>
          )}
        </span>
      </label>
      <FieldFeedback id={inputId} error={error} />
    </div>
  );
}

/** Same-name Radio controls use the browser's native arrow-key group behavior. */
export function Checkbox(props: SelectionProps) {
  return <SelectionControl {...props} kind="checkbox" />;
}

export function Radio(props: SelectionProps) {
  return <SelectionControl {...props} kind="radio" />;
}

/** Native checkbox with switch semantics; the whole 48px label row is clickable. */
export function Switch(props: SelectionProps) {
  return <SelectionControl {...props} kind="switch" />;
}

export { Switch as Toggle };
