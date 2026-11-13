import { z } from 'zod';
import type { SavedQuery } from '@apnatown/shared';

export const SavedViewSchema = z.object({
  tab: z.enum(['shops', 'services', 'media']).default('shops'),
  media: z.enum(['all', 'photos', 'videos', 'reels']).default('all'),
});
export type SavedView = z.infer<typeof SavedViewSchema>;

export function savedRequest(view: SavedView): SavedQuery | null {
  if (view.tab === 'media' && view.media === 'photos') return null;
  return {
    tab: view.tab,
    mediaFilter:
      view.tab === 'media' && view.media !== 'photos' ? view.media : 'all',
    limit: 20,
  };
}

export function savedHref(view: SavedView) {
  const query = new URLSearchParams({ tab: view.tab });
  if (view.tab === 'media') query.set('media', view.media);
  return `/saved?${query}`;
}
