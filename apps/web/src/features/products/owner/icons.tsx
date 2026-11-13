/**
 * Prototype icon paths (same 24px stroke grid as `shared/ui/NavIcon`) that
 * NavIcon does not carry yet. Feature-local so this screen does not edit the
 * concurrently-owned shared icon set. TODO(verify): fold into NavIcon.
 */
const paths = {
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  sliders:
    'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  back: 'M15 6l-6 6 6 6',
} as const;

export type ProductIconName = keyof typeof paths;

export function ProductIcon({
  name,
  className = 'size-5',
}: {
  name: ProductIconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`${className} shrink-0`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
