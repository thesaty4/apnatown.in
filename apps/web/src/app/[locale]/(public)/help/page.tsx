import { getTranslations } from 'next-intl/server';
import { FaqList } from '../../../../features/support/FaqList';
import { SupportForm } from '../../../../features/support/SupportForm';
import { publicPageMetadata } from '../../../../features/support/metadata';

export async function generateMetadata() {
  const t = await getTranslations('help');
  return publicPageMetadata('/help', t('page.title'));
}

// Static FAQ from i18n; the support form and configured contacts are client.
export default async function HelpPage() {
  const t = await getTranslations('help');
  return (
    <div className="grid max-w-prose gap-4">
      <h1 className="text-h1">{t('page.title')}</h1>
      <FaqList />
      <SupportForm />
    </div>
  );
}
