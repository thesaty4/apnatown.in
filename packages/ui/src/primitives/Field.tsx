import type { AriaAttributes, ReactNode } from 'react';

/** Internal layout shared by native controls; all copy is supplied by the caller. */
export type FieldProps = {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  wrapperClassName?: string | undefined;
};

export const fieldControlClassName =
  'w-full min-w-0 rounded-md border-2 bg-surface ' +
  'px-field-inline py-field-block font-body text-body text-text placeholder:text-muted ' +
  'focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-surface-2 ' +
  'disabled:opacity-50';

export function fieldBorderClassName(invalid: AriaAttributes['aria-invalid']) {
  return invalid && invalid !== 'false'
    ? 'border-error'
    : 'border-border-strong focus:border-primary';
}

export function descriptionIds(...ids: (string | undefined)[]) {
  return (
    [
      ...new Set(ids.filter(Boolean).join(' ').split(/\s+/).filter(Boolean)),
    ].join(' ') || undefined
  );
}

export function FieldFeedback({
  id,
  hint,
  error,
}: Pick<FieldProps, 'hint' | 'error'> & { id: string }) {
  return (
    <>
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-small-min text-muted [overflow-wrap:anywhere]"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-field-error font-medium text-error [overflow-wrap:anywhere]"
        >
          {error}
        </p>
      )}
    </>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  wrapperClassName = '',
  children,
}: FieldProps & {
  id: string;
  required?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <div className={`grid min-w-0 gap-field-gap ${wrapperClassName}`}>
      <label
        htmlFor={id}
        className="text-field-label font-semibold text-text [overflow-wrap:anywhere]"
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      <FieldFeedback id={id} hint={hint} error={error} />
    </div>
  );
}
