import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from '../src/shared/auth/SessionProvider.tsx';
import { QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { createQueryClient } from '../src/shared/api/query-client.ts';
import { hydrateResource } from '../src/shared/api/hydration.ts';
import { accountScope, queryKeys } from '../src/shared/api/query-keys.ts';
import en from '../src/shared/i18n/messages/en.json' with { type: 'json' };
import hi from '../src/shared/i18n/messages/hi.json' with { type: 'json' };

export const session = {
  userId: '10000000-0000-4000-8000-000000000001',
  roles: ['customer'],
  approvalStates: { businesses: 'unavailable', rider: 'unavailable' },
  accountStatus: 'active',
  expiresAt: '2099-01-01T00:00:00.000Z',
};
export const profile = {
  userId: session.userId,
  phone: '+919000000000',
  displayName: 'Test Customer',
  email: null,
  version: 1,
};

export async function render(
  element,
  { locale = 'en', initial = { kind: 'ready', data: session } } = {},
) {
  const client = createQueryClient();
  const state = await hydrateResource(queryKeys.session, initial);
  if (element.props.initial?.kind) {
    const key = element.type.name === 'Preferences' ? 'preferences' : 'profile';
    element = React.cloneElement(element, {
      initial: await hydrateResource(
        queryKeys[key](accountScope(session, 0)),
        element.props.initial,
      ),
    });
  }
  try {
    return renderToStaticMarkup(
      React.createElement(
        NextIntlClientProvider,
        {
          locale,
          messages: locale === 'hi' ? hi : en,
          timeZone: 'Asia/Kolkata',
        },
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(
            HydrationBoundary,
            { state },
            React.createElement(SessionProvider, null, element),
          ),
        ),
      ),
    );
  } finally {
    client.clear();
  }
}
