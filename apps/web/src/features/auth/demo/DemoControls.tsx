'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { DemoPersona } from '@apnatown/shared/auth';
import { Card } from '@apnatown/ui/cards/Card';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { Failure } from '../../../shared/auth/AccessState';
import { iconButton } from '../../../shared/auth/AccountNavigation';
import { useSession } from '../../../shared/auth/SessionProvider';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { startDemoSession } from './api';
import { activePersona, demoHome, demoRoles } from './personas';

/** Prototype `A.demo` "View as" sheet: signs in as the seeded persona. */
function DemoControlsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { api, lifecycle, signedIn, state } = useSession();
  const t = useTranslations('auth.demo');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const labelId = useId();
  const [picked, setPicked] = useState<DemoPersona>();
  const mutation = usePrivateMutation(
    lifecycle,
    (persona: DemoPersona, guard) => startDemoSession(api, persona, guard),
  );
  const busy = mutation.isPending;
  const error = mutation.isError ? failureCode(mutation.error) : undefined;
  const current =
    state.kind === 'ready' ? activePersona(state.data.roles) : undefined;
  function pick(persona: DemoPersona) {
    if (busy) return;
    mutation.reset();
    setPicked(persona);
    void mutation.run(persona, () => {
      mutation.reset();
      void signedIn();
      window.location.replace(demoHome(persona, locale));
    });
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) mutation.reset();
        onOpenChange(next);
      }}
      title={t('title')}
      description={t('description')}
      closeLabel={t('close')}
      busy={busy}
    >
      <div className="grid gap-3">
        <p id={labelId} className="text-small font-semibold text-text-2">
          {t('viewAs')}
        </p>
        <div
          role="group"
          aria-labelledby={labelId}
          className="grid grid-cols-2 gap-2"
        >
          {demoRoles.map(({ persona, label, emoji }) => {
            const active = persona !== undefined && persona === current;
            return (
              <Button
                key={label}
                size="small"
                variant={active ? 'primary' : 'ghost'}
                aria-pressed={persona ? active : undefined}
                disabled={!persona || busy}
                loading={busy && picked === persona}
                onClick={() => persona && pick(persona)}
              >
                <span aria-hidden="true">{emoji}</span>
                <span>{t(`role.${label}`)}</span>
                {active && <NavIcon name="check" className="size-4" />}
                {!persona && (
                  <span className="text-caption">({t('comingSoon')})</span>
                )}
              </Button>
            );
          })}
        </div>
        {error && picked && (
          <Failure
            code={error}
            retryDisabled={busy}
            retry={() => pick(picked)}
          />
        )}
      </div>
    </Sheet>
  );
}

/** Header `users` icon button (prototype "Switch role"). */
export function DemoSwitcher() {
  const t = useTranslations('auth.demo');
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={iconButton}
        aria-label={t('open')}
        aria-haspopup="dialog"
        title={t('open')}
        onClick={() => setOpen(true)}
      >
        <NavIcon name="users" />
      </button>
      <DemoControlsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Account "Switch role" card (prototype js7 account screen). */
export function DemoRoleCard() {
  const t = useTranslations('auth.demo');
  const [open, setOpen] = useState(false);
  return (
    <Card padded className="grid gap-2">
      <h2 className="text-h3">{t('cardTitle')}</h2>
      <p className="text-small text-text-2">{t('cardBody')}</p>
      <Button
        variant="outline"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <NavIcon name="users" className="size-4.5" />
        {t('cardAction')}
      </Button>
      <DemoControlsSheet open={open} onOpenChange={setOpen} />
    </Card>
  );
}
