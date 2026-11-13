'use client';

export type PermissionMatrixOption = { key: string; label: string };
export type PermissionMatrixProps = {
  /** Localized table caption (visible). */
  caption: string;
  /** Localized heading of the module column. */
  moduleHeading: string;
  modules: readonly PermissionMatrixOption[];
  actions: readonly PermissionMatrixOption[];
  /** Granted actions per module key. */
  value: Readonly<Record<string, readonly string[]>>;
  /** Localized accessible name for one cell, e.g. "Orders: Edit". */
  cellLabel: (module: string, action: string) => string;
  /** Normalization (e.g. action implies view) belongs to the caller. */
  onToggle?: (module: string, action: string, checked: boolean) => void;
  disabled?: boolean;
};

/** Module × action grid of native checkboxes; keyboard order is row by row. */
export function PermissionMatrix({
  caption,
  moduleHeading,
  modules,
  actions,
  value,
  cellLabel,
  onToggle,
  disabled = false,
}: PermissionMatrixProps) {
  const readOnly = disabled || !onToggle;
  return (
    <div className="min-w-0 overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-small">
        <caption className="p-2 text-start font-semibold [overflow-wrap:anywhere]">
          {caption}
        </caption>
        <thead>
          <tr className="bg-surface-2">
            <th scope="col" className="p-2 text-start">
              {moduleHeading}
            </th>
            {actions.map((action) => (
              <th key={action.key} scope="col" className="p-2 text-center">
                {action.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.key} className="border-t border-border">
              <th
                scope="row"
                className="p-2 text-start font-medium [overflow-wrap:anywhere]"
              >
                {module.label}
              </th>
              {actions.map((action) => {
                const checked =
                  value[module.key]?.includes(action.key) ?? false;
                return (
                  <td key={action.key} className="p-0 text-center">
                    <label className="inline-flex min-h-touch min-w-touch items-center justify-center">
                      <input
                        type="checkbox"
                        className="m-0 size-selection-control accent-primary focus-visible:ring-focus disabled:cursor-not-allowed"
                        aria-label={cellLabel(module.key, action.key)}
                        checked={checked}
                        disabled={readOnly}
                        onChange={(event) =>
                          onToggle?.(
                            module.key,
                            action.key,
                            event.target.checked,
                          )
                        }
                      />
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
