import type { Metadata } from 'next';
import { Goodbye } from '../../../../features/users/Goodbye';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Static shell: the confirmation depends only on in-memory client proof.
export default function GoodbyePage() {
  return <Goodbye />;
}
