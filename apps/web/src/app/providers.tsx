'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';
import type { Locale } from '../shared/i18n/preferences';

/** No unused query/overlay/toast stores. Add them with their first real consumer. */
export function Providers({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Kolkata"
    >
      {children}
    </NextIntlClientProvider>
  );
}
