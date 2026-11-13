import { getTranslations } from 'next-intl/server';
import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';

/**
 * Offers, Videos/Reels and Reviews are owned by modules whose per-business
 * public reads do not exist yet; the honest empty state never fakes content.
 */
export async function ComingSoonPanel({
  section,
  rating,
}: {
  section: 'offers' | 'videos' | 'reviews';
  rating?: { value: number; count: number } | undefined;
}) {
  const t = await getTranslations('business.publicProfile.comingSoon');
  const icon = { offers: '🏷️', videos: '🎬', reviews: '⭐' }[section];
  return (
    <div className="grid gap-2">
      {rating && (
        <p className="m-0 text-center font-semibold">
          <span aria-hidden="true" className="text-star">★ </span>
          {t('ratingSummary', { rating: rating.value, count: rating.count })}
        </p>
      )}
      <EmptyState
        headingLevel="h2"
        icon={icon}
        title={t(`${section}Title`)}
        message={t(`${section}Message`)}
        action={null}
      />
    </div>
  );
}

/** Approved public profile photos (≤5) from the business DTO. */
export async function GalleryPanel({
  images,
  name,
}: {
  images: BusinessDiscoveryDetail['images'];
  name: string;
}) {
  const t = await getTranslations('business.publicProfile.gallery');
  if (images.length === 0)
    return (
      <EmptyState
        headingLevel="h2"
        icon="🖼️"
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={null}
      />
    );
  return (
    <section aria-labelledby="profile-gallery-title" className="grid gap-3">
      <h2 id="profile-gallery-title" className="sr-only">{t('title')}</h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 tablet:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.path} className="min-w-0">
            <img
              src={image.path}
              alt={t('imageAlt', { name, number: index + 1 })}
              width={image.width}
              height={image.height}
              loading="lazy"
              decoding="async"
              className="aspect-square size-full rounded-md bg-surface-2 object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
