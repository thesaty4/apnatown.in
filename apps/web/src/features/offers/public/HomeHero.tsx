import type { Locale } from '../../../shared/i18n/preferences';
import { HeroCarousel } from './HeroCarousel';
import { readHeroBanners } from './server';

/**
 * Renders live hero banners; a failed or empty read omits the section rather
 * than showing a fabricated promotion (Offers owns eligibility).
 */
export async function HomeHero({ locale }: { locale: Locale }) {
  const result = await readHeroBanners();
  if (result.kind !== 'ready' || result.data.items.length === 0) return null;
  return <HeroCarousel items={result.data.items} locale={locale} />;
}
