import { getTranslations } from 'next-intl/server';
import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';
import type { MapConfiguration } from '@apnatown/ui/geo/MapView';
import { Card } from '@apnatown/ui/cards/Card';
import { DirectionsAction } from '../../geo';
import { ProfileMap } from './ProfileMap';
import { ProfileQr } from './ProfileQr';
import { safeHttpUrl } from './json-ld';

const SOCIAL = [
  ['instagramUrl', 'instagram', '📸'],
  ['facebookUrl', 'facebook', '👥'],
  ['youtubeUrl', 'youtube', '▶️'],
  ['websiteUrl', 'website', '🌐'],
] as const;

/** Contact & Location: approved address/pin/phone/social links only. */
export async function ContactPanel({
  detail,
  name,
  mapConfig,
  profileUrl,
}: {
  detail: BusinessDiscoveryDetail;
  name: string;
  mapConfig: MapConfiguration;
  profileUrl: string;
}) {
  const t = await getTranslations('business.publicProfile.contact');
  const { item, profile } = detail;
  const links = SOCIAL.flatMap(([field, key, icon]) => {
    const href = safeHttpUrl(profile.socialLinks[field]);
    return href ? [{ key, icon, href }] : [];
  });
  return (
    <section aria-labelledby="profile-contact-title" className="grid min-w-0 gap-stack-gap desktop:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <h2 id="profile-contact-title" className="sr-only">{t('title')}</h2>
      <div className="grid min-w-0 content-start gap-stack-gap">
        <Card padded className="grid gap-3">
          <h3 className="m-0 font-display text-h3">{t('address')}</h3>
          <p className="m-0 [overflow-wrap:anywhere]">{profile.addressText ?? t('noAddress')}</p>
          {item.phone && (
            <p className="m-0">
              <span className="font-semibold">{t('phone')}: </span>
              <a href={`tel:${item.phone}`} className="inline-flex min-h-touch items-center rounded-sm text-primary underline focus-visible:ring-focus">
                <bdi dir="ltr">{item.phone}</bdi>
              </a>
            </p>
          )}
          {profile.location ? (
            <>
              <ProfileMap config={mapConfig} location={profile.location} name={name} />
              <DirectionsAction destination={profile.location} placeName={name} variant="outline" className="justify-self-start" />
            </>
          ) : (
            <p className="m-0 flex items-center gap-2 text-small text-text-2">
              <span aria-hidden="true">📍</span>
              {t('noLocation')}
            </p>
          )}
        </Card>
      </div>
      <div className="grid min-w-0 content-start gap-stack-gap">
        <Card padded className="grid gap-3">
          <h3 className="m-0 font-display text-h3">{t('social')}</h3>
          {links.length > 0 ? (
            <ul className="m-0 grid list-none gap-1 p-0">
              {links.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-touch items-center gap-2 rounded-sm text-primary underline [overflow-wrap:anywhere] focus-visible:ring-focus"
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    {t(link.key)}
                    <span className="sr-only">{t('opensNewTab')}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-small text-text-2">{t('noSocial')}</p>
          )}
        </Card>
        <Card padded className="grid gap-3">
          <h3 className="m-0 font-display text-h3">{t('qr')}</h3>
          <ProfileQr url={profileUrl} name={name} />
        </Card>
      </div>
    </section>
  );
}
