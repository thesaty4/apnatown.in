import { Chip, type ChipProps } from './Chip.js';

export type PillProps = ChipProps;

/** Category/subcategory appearance is the same .chip used by prototype .pills.
 * Row scrolling and selection/URL state belong to the consuming filter or tabs.
 */
export function Pill(props: PillProps) {
  return <Chip {...props} />;
}
