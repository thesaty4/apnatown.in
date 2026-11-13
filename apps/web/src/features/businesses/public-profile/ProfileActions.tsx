import { getTranslations } from 'next-intl/server';
import type { BusinessDiscoveryDetail } from '@apnatown/shared/public-listings';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { BusinessFollowButton } from '../../engagement';
import { DirectionsAction } from '../../geo';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { ShareAction } from './ShareAction';

const E164 = /^\+[1-9]\d{7,14}$/;

/** Validated E.164 only; anything else hides the action rather than guessing. */
function phoneDigits(value: string | null) {
  return value && E164.test(value) ? value.slice(1) : null;
}

/**
 * Prototype `actionBar`: Follow/Save, Call (primary), WhatsApp (secondary),
 * Directions, Share. Every action uses approved public profile fields and is
 * omitted when its field is absent.
 */
export async function ProfileActions({
  detail,
  name,
  locale,
}: {
  detail: BusinessDiscoveryDetail;
  name: string;
  locale: Locale;
}) {
  const t = await getTranslations('business.publicProfile.actions');
  const { item, profile } = detail;
  const call = phoneDigits(item.phone);
  const whatsapp = phoneDigits(item.whatsappPhone);
  const action = 'min-w-0 flex-1 basis-[calc(50%-0.5rem)] tablet:basis-auto tablet:flex-none';
  return (
    <div
      role="group"
      aria-label={t('label')}
      className="flex flex-wrap gap-2 print:hidden"
    >
      <div className={action}>
        <BusinessFollowButton businessId={item.business.id} />
      </div>
      {call && (
        <a
          href={`tel:+${call}`}
          aria-label={t('callNamed', { name })}
          className={`${buttonVariantClassName('primary')} ${action}`}
        >
          <NavIcon name="phone" className="size-4.5 shrink-0" />
          {t('call')}
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(t('whatsappText', { name }))}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('whatsappNamed', { name })}
          className={`${buttonVariantClassName('secondary')} ${action}`}
        >
          <NavIcon name="chat" className="size-4.5 shrink-0" />
          {t('whatsapp')}
          <span className="sr-only">{t('opensNewTab')}</span>
        </a>
      )}
      {profile.location && (
        <DirectionsAction
          destination={profile.location}
          placeName={name}
          variant="ghost"
          className={action}
        />
      )}
      <div className={`grid ${action}`}>
        <ShareAction name={name} path={publicHref(item.path, locale)} />
      </div>
    </div>
  );
}
