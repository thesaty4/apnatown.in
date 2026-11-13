import { getTranslations } from 'next-intl/server';
import { LegalLink } from '../../../../features/support/LegalPage';
import {
  LegalRoute,
  legalMetadata,
} from '../../../../features/support/LegalRoute';

// ISR-style: the legal read is cached under the `legal:privacy` tag.
export const generateMetadata = () => legalMetadata('privacy');

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');
  return (
    <LegalRoute slug="privacy">
      <nav aria-label={t('actions')} className="flex flex-wrap gap-4">
        {/* Data export/deletion live on the signed-in account page (F-AC-004). */}
        <LegalLink href="/account">{t('download')}</LegalLink>
        <LegalLink href="/account">{t('delete')}</LegalLink>
      </nav>
    </LegalRoute>
  );
}
