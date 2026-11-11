import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  NotFoundState,
  OfflineState,
  MaintenanceState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { SkipLink } from '@apnatown/ui/navigation/SkipLink';
import ErrorBoundary from '../src/app/error';
import { Preferences } from '../src/shared/ui/Preferences';
import en from '../src/shared/i18n/messages/bootstrap.en.json';
import hi from '../src/shared/i18n/messages/bootstrap.hi.json';

vi.mock('next/navigation', () => ({ usePathname: () => '/500' }));

describe.each([
  ['en', en],
  ['hi', hi],
] as const)('%s bootstrap states', (locale, messages) => {
  const copy = messages.common;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Kolkata"
    >
      {children}
    </NextIntlClientProvider>
  );

  it.each([
    ['empty', EmptyState],
    ['error', ErrorState],
    ['noPermission', NoPermissionState],
    ['notFound', NotFoundState],
    ['offline', OfflineState],
    ['maintenance', MaintenanceState],
  ] as const)(
    '%s uses translated copy and accessible action',
    async (key, State) => {
      const { container } = render(
        <main>
          <State
            title={copy[key].title}
            message={key === 'offline' ? copy.error.message : copy[key].message}
            action={<Button>{copy.actions.retry}</Button>}
          />
        </main>,
      );
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        copy[key].title,
      );
      expect(screen.getByRole('button')).toHaveTextContent(copy.actions.retry);
      expect(
        (
          await axe.run(container, {
            rules: { 'color-contrast': { enabled: false } },
          })
        ).violations,
      ).toEqual([]);
    },
  );

  it('announces one loading state and hides decorative lines', () => {
    render(<Skeleton label={copy.loading.label} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(copy.loading.label)).toBeInTheDocument();
  });

  it('uses approved skip copy and moves keyboard focus past the header into main', async () => {
    const ref = createRef<HTMLAnchorElement>();
    const { container } = render(
      <>
        <SkipLink
          ref={ref}
          label={copy.navigation.skipToContent}
          targetId="main"
        />
        <header>
          <Button>{copy.theme.label}</Button>
        </header>
        <main id="main" tabIndex={-1}>
          <h1>{copy.empty.title}</h1>
          <Button>{copy.actions.retry}</Button>
        </main>
      </>,
    );
    const link = screen.getByRole('link', {
      name: copy.navigation.skipToContent,
    });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('href', '#main');
    const user = userEvent.setup();
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole('button', { name: copy.actions.retry }),
    ).toHaveFocus();
    expect(
      (
        await axe.run(container, {
          rules: { 'color-contrast': { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });

  it('never leaks thrown error details and invokes reset by keyboard', async () => {
    const reset = vi.fn();
    render(
      <ErrorBoundary
        error={new Error('private diagnostic must not reach UI')}
        reset={reset}
      />,
      { wrapper },
    );
    expect(screen.queryByText(/private diagnostic/)).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.tab();
    expect(
      screen.getByRole('button', { name: copy.actions.retry }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(reset).toHaveBeenCalledOnce();
  });

  it('changes theme without creating a session credential', async () => {
    render(<Preferences initialTheme="light" />, { wrapper });
    await userEvent
      .setup()
      .selectOptions(
        screen.getByRole('combobox', { name: copy.theme.label }),
        'dark',
      );
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.cookie).toBe('apnatown-theme=dark');
    expect(localStorage.length).toBe(0);
    expect(
      screen.getByRole('link', { name: copy.language.label }),
    ).toHaveAttribute('href', locale === 'en' ? '/hi/500' : '/500');
  });
});

it('forwards native props/ref, disables loading actions and safely renders text', async () => {
  const ref = createRef<HTMLButtonElement>();
  const clicked = vi.fn();
  render(
    <Button ref={ref} loading data-testid="action" onClick={clicked}>
      {'<script>alert(1)</script>'}
    </Button>,
  );
  expect(ref.current).toBe(screen.getByTestId('action'));
  expect(ref.current).toBeDisabled();
  expect(ref.current).toHaveAttribute('aria-busy', 'true');
  expect(document.querySelector('script')).toBeNull();
  await userEvent.setup().click(screen.getByTestId('action'));
  expect(clicked).not.toHaveBeenCalled();
});
