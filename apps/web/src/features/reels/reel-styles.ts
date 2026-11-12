/** Prototype `.reels` focus: 3px white outline on the always-dark surface. */
export const reelFocus =
  'focus-visible:outline-(length:--at-focus-ring) focus-visible:outline-solid ' +
  'focus-visible:outline-offset-2 focus-visible:outline-reel-text';

/** Inset variant for edge-to-edge regions such as the scrollable feed. */
export const reelFocusInset =
  'focus-visible:outline-(length:--at-focus-ring) focus-visible:outline-solid ' +
  'focus-visible:-outline-offset-3 focus-visible:outline-reel-text';

/** Prototype translucent `.iconbtn` circle on the dark surface; add a size. */
export const reelIconButtonClassName =
  'inline-grid shrink-0 place-items-center rounded-pill ' +
  'bg-reel-text/14 text-reel-text transition-colors duration-2 ease-standard ' +
  'hover:bg-reel-text/25 disabled:cursor-not-allowed disabled:opacity-50 ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ' +
  `motion-reduce:transition-none ${reelFocus}`;

/** Prototype `.rtop .iconbtn`: 44px. */
export const reelTopIconClassName = `size-icon-min ${reelIconButtonClassName}`;

/** Prototype `.rrail button`: 48px dark translucent circle. */
export const reelRailButtonClassName =
  'relative grid size-touch place-items-center rounded-pill bg-reel-canvas/45 ' +
  'text-reel-text transition-transform duration-2 ease-standard ' +
  'motion-safe:active:scale-95 aria-busy:cursor-progress aria-disabled:cursor-not-allowed ' +
  'aria-disabled:opacity-50 ' +
  `aria-pressed:text-reel-liked motion-reduce:transition-none ${reelFocus}`;

/** Prototype `.rrail .n`. */
export const reelCountClassName =
  'm-0 mt-0.5 text-center text-reel-count font-semibold tabular-nums';

/** Prototype `.rpill` and `.rpill.on`. */
export function reelPillClassName(selected: boolean) {
  return (
    'inline-flex min-h-reel-compact shrink-0 items-center whitespace-nowrap ' +
    'rounded-pill border-(length:--at-chip-border) px-3.5 text-reel-pill-text ' +
    'font-semibold transition-colors duration-2 ease-standard ' +
    'motion-reduce:transition-none aria-disabled:cursor-not-allowed ' +
    `aria-disabled:opacity-50 ${reelFocus} ` +
    (selected
      ? 'border-reel-text bg-reel-text text-reel-canvas'
      : 'border-reel-text/35 bg-reel-text/10 text-reel-text hover:bg-reel-text/25')
  );
}
