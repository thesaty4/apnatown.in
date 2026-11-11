'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@apnatown/ui/primitives/Button';

export function RetryButton({ children }: { children: string }) {
  const router = useRouter();
  return <Button onClick={() => router.refresh()}>{children}</Button>;
}
