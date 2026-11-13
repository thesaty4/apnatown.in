'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { useState, type ReactNode } from 'react';
import {
  HydrationBoundary,
  QueryClientProvider,
  type DehydratedState,
} from '@tanstack/react-query';
import type { Locale } from '../shared/i18n/preferences';
import { SessionProvider } from '../shared/auth/SessionProvider';
import { RealtimeProvider } from '../shared/realtime/RealtimeProvider';
import { createQueryClient } from '../shared/api/query-client';

/** One client per mounted browser provider; SSR constructs a fresh instance. */
export function Providers({
  children,
  locale,
  messages,
  session,
}: {
  children: ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
  session: DehydratedState;
}) {
  const [client] = useState(createQueryClient);
  // Root RSC refreshes must not rehydrate an old session after an auth transition.
  const [initialSession] = useState(session);
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Kolkata"
    >
      <QueryClientProvider client={client}>
        <HydrationBoundary state={initialSession}>
          <SessionProvider>
            <RealtimeProvider>{children}</RealtimeProvider>
          </SessionProvider>
        </HydrationBoundary>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
