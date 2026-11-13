import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * schema.org LocalBusiness from approved, stored public fields only: no
 * derived address parts, no fabricated price range or review list.
 */
export function localBusinessJsonLd(
  detail: BusinessDiscoveryDetail,
  {
    name,
    url,
    origin,
  }: { name: string; url: string; origin: string },
) {
  const { item, profile, hours, description } = detail;
  const image = [profile.cover, profile.logo, ...detail.images]
    .filter((variant) => variant !== null)
    .map((variant) => new URL(variant.path, origin).toString());
  const openingHours = hours
    .filter(
      (day) =>
        !day.isClosed &&
        day.opensAt &&
        day.closesAt &&
        TIME.test(day.opensAt) &&
        TIME.test(day.closesAt),
    )
    .map((day) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DAYS[day.dayOfWeek]}`,
      opens: day.opensAt,
      closes: day.closesAt,
    }));
  const sameAs = [
    profile.socialLinks.instagramUrl,
    profile.socialLinks.facebookUrl,
    profile.socialLinks.youtubeUrl,
    profile.socialLinks.websiteUrl,
  ].filter((link): link is string => link !== null && safeHttpUrl(link) !== null);
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    url,
    ...(description && { description }),
    ...(image.length > 0 && { image }),
    ...(item.phone && { telephone: item.phone }),
    ...(profile.addressText && { address: profile.addressText }),
    ...(profile.location && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: profile.location.lat,
        longitude: profile.location.lng,
      },
    }),
    ...(openingHours.length > 0 && {
      openingHoursSpecification: openingHours,
    }),
    ...(item.rating !== null &&
      item.reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: item.rating,
          reviewCount: item.reviewCount,
        },
      }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/** Only absolute http(s) links from the API are ever rendered or linked. */
export function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
