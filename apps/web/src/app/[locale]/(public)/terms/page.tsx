import {
  LegalRoute,
  legalMetadata,
} from '../../../../features/support/LegalRoute';

// ISR-style: the legal read is cached under the `legal:terms` tag.
export const generateMetadata = () => legalMetadata('terms');

export default function TermsPage() {
  return <LegalRoute slug="terms" />;
}
