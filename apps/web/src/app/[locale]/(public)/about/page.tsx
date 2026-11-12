import { getTranslations } from 'next-intl/server';
import { Card } from '@apnatown/ui/cards/Card';
import {
  LegalRoute,
  legalMetadata,
} from '../../../../features/support/LegalRoute';

// ISR-style: the legal read is cached under the `legal:about` tag.
export const generateMetadata = () => legalMetadata('about');

const cards = [
  ['🏪', 'localShops'],
  ['🔧', 'trustedServices'],
  ['🛵', 'fastDelivery'],
] as const;

export default async function AboutPage() {
  const t = await getTranslations('legal.about');
  return (
    <LegalRoute slug="about">
      <ul className="grid gap-3 tablet:grid-cols-3">
        {cards.map(([icon, key]) => (
          <li key={key}>
            <Card
              padded
              className="grid h-full place-items-center gap-2 text-center"
            >
              <span aria-hidden="true" className="text-h1">
                {icon}
              </span>
              <span className="font-semibold">{t(key)}</span>
            </Card>
          </li>
        ))}
      </ul>
    </LegalRoute>
  );
}
