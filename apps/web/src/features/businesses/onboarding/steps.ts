import type { FieldErrors } from '../form-model';

export const STEPS = [
  'mobile',
  'type',
  'basics',
  'location',
  'hours',
  'documents',
  'review',
] as const;
export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Fields validated by "Next" on a step (submit re-checks everything). */
export const stepFields: Partial<Record<Step, (keyof FieldErrors)[]>> = {
  3: ['nameEn', 'nameHi', 'categoryIds', 'primaryCategoryId', 'description'],
  4: ['areaId', 'addressText', 'location', 'whatsapp', 'businessPhone'],
};
export const firstStepWith = (errors: FieldErrors): Step => {
  for (const step of [3, 4, 5] as const)
    if ((stepFields[step] ?? []).some((field) => errors[field])) return step;
  return 5;
};
