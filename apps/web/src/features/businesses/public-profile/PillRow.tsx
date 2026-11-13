'use client';

import { useEffect, useRef } from 'react';
import { useFormatter } from 'next-intl';
import { Pill } from '@apnatown/ui/primitives/Pill';

export type PillOption = {
  /** `undefined` is the "All" pill. */
  value: string | undefined;
  label: string;
  count: number;
};

/**
 * Prototype `.pills` row: one horizontally scrollable line of counted
 * filter toggles in API order. Selection is `aria-pressed` (text + ✓ icon,
 * never colour alone); the selected pill is kept in view without moving the
 * page vertically.
 */
export function PillRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: readonly PillOption[];
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
}) {
  const format = useFormatter();
  const row = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const pill = row.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    pill?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selected]);
  return (
    <ul
      ref={row}
      aria-label={label}
      className="m-0 flex list-none gap-2 overflow-x-auto overscroll-x-contain p-0 py-1 [scrollbar-width:thin]"
    >
      {options.map((option) => (
        <li key={option.value ?? ''} className="max-w-[80vw] shrink-0">
          <Pill
            label={option.label}
            count={format.number(option.count)}
            selected={option.value === selected}
            onClick={() => onSelect(option.value)}
          />
        </li>
      ))}
    </ul>
  );
}
