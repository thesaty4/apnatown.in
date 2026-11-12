import {
  LegalRoute,
  legalMetadata,
} from '../../../../features/support/LegalRoute';

// ISR-style: the legal read is cached under the `legal:refund` tag.
export const generateMetadata = () => legalMetadata('refund');

export default function RefundPolicyPage() {
  return <LegalRoute slug="refund" />;
}
