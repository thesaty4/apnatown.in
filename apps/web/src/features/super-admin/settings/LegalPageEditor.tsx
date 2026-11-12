'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import {
  LEGAL_SLUGS,
  UpdateLegalPageSchema,
  type LegalSlug,
  type SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Input } from '@apnatown/ui/primitives/Input';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { queryKeys } from '../../../shared/api/query-keys';
import { AdminFailure, Alert, Notice, useAdmin } from '../../admin';
import { useIdempotentCommand } from '../queries';
import { putLegalPage } from './api';
import { useReportDirty } from './form';

type Draft = {
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
};
type Status = SuperAdminSettings['legal'][number];
const locales = ['en', 'hi'] as const;
type Tab = (typeof locales)[number];

const draftOf = (status: Status): Draft => ({
  titleEn: status.page?.titleEn ?? '',
  titleHi: status.page?.titleHi ?? '',
  bodyEn: status.page?.bodyEn ?? '',
  bodyHi: status.page?.bodyHi ?? '',
});

function Editor({
  status,
  onClose,
  onSaved,
}: {
  status: Status;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('superAdmin.settings.legal');
  const tf = useTranslations('superAdmin.settings');
  const { scope } = useAdmin();
  const client = useQueryClient();
  const [draft, setDraft] = useState(() => draftOf(status));
  const [base, setBase] = useState(() => ({
    draft: draftOf(status),
    version: status.version,
  }));
  const [tab, setTab] = useState<Tab>('en');
  const [issues, setIssues] = useState<Set<string>>(new Set());
  const [confirmClose, setConfirmClose] = useState(false);
  const tabs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const command = useIdempotentCommand(putLegalPage);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base.draft);
  useReportDirty(`legal:${status.slug}`, dirty);
  const serverIssues =
    command.code === 'SETTINGS_INVALID' ? new Set(command.fields) : new Set();
  const has = (name: keyof Draft) => issues.has(name) || serverIssues.has(name);

  const save = () => {
    const parsed = UpdateLegalPageSchema.safeParse({
      ...draft,
      expectedVersion: base.version,
    });
    const found = new Set(
      parsed.success
        ? []
        : parsed.error.issues.map((issue) => String(issue.path[0])),
    );
    setIssues(found);
    if (found.size) {
      if (!found.has('titleEn') && !found.has('bodyEn')) setTab('hi');
      else setTab('en');
      return;
    }
    command.submit(
      { slug: status.slug, body: { ...draft, expectedVersion: base.version } },
      () => onSaved(),
    );
  };
  const reload = async () => {
    const queryKey = queryKeys.settings(scope);
    await client.refetchQueries({ queryKey });
    const fresh = client
      .getQueryData<SuperAdminSettings>(queryKey)
      ?.legal.find((item) => item.slug === status.slug);
    if (!fresh) return;
    // Keep the draft; rebase only after the fresh version is hydrated.
    setBase({ draft: draftOf(fresh), version: fresh.version });
    command.mutation.reset();
  };
  const close = () => (dirty ? setConfirmClose(true) : onClose());
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next: Tab =
      event.key === 'Home'
        ? 'en'
        : event.key === 'End'
          ? 'hi'
          : tab === 'en'
            ? 'hi'
            : 'en';
    setTab(next);
    tabs.current[next]?.focus();
  };

  return (
    <>
      <Sheet
        open
        wide
        busy={command.busy}
        onOpenChange={(open) => !open && close()}
        title={t('editTitle', { page: t(`pages.${status.slug}`) })}
        closeLabel={tf('close')}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {tf('cancel')}
            </Button>
            <Button
              disabled={command.busy || !dirty}
              aria-busy={command.busy}
              onClick={save}
            >
              {command.busy ? tf('saving') : t('publish')}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div
            role="tablist"
            aria-label={t('languages')}
            className="flex gap-2"
          >
            {locales.map((locale) => (
              <button
                key={locale}
                ref={(node) => {
                  tabs.current[locale] = node;
                }}
                type="button"
                role="tab"
                id={`legal-tab-${locale}`}
                aria-selected={tab === locale}
                aria-controls={`legal-panel-${locale}`}
                tabIndex={tab === locale ? 0 : -1}
                onKeyDown={onTabKey}
                onClick={() => setTab(locale)}
                className={`min-h-touch rounded-pill border-2 px-4 font-semibold focus-visible:ring-focus ${tab === locale ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface text-text'}`}
              >
                {tf(locale === 'en' ? 'english' : 'hindi')}
              </button>
            ))}
          </div>
          {locales.map((locale) => {
            const title = locale === 'en' ? 'titleEn' : 'titleHi';
            const body = locale === 'en' ? 'bodyEn' : 'bodyHi';
            return (
              <div
                key={locale}
                role="tabpanel"
                id={`legal-panel-${locale}`}
                aria-labelledby={`legal-tab-${locale}`}
                hidden={tab !== locale}
                lang={locale}
                className="grid gap-3"
              >
                <Input
                  label={t('pageTitle')}
                  maxLength={120}
                  required
                  value={draft[title]}
                  error={has(title) ? tf('errors.text') : undefined}
                  onChange={(event) =>
                    setDraft({ ...draft, [title]: event.target.value })
                  }
                />
                <TextArea
                  label={t('body')}
                  hint={t('bodyHint')}
                  rows={14}
                  maxLength={12000}
                  required
                  value={draft[body]}
                  error={has(body) ? tf('errors.field') : undefined}
                  onChange={(event) =>
                    setDraft({ ...draft, [body]: event.target.value })
                  }
                />
              </div>
            );
          })}
          {issues.size > 0 && <Alert message={tf('errors.summary')} />}
          {command.code === 'SETTINGS_VERSION_CONFLICT' ? (
            <Alert
              message={tf('conflict')}
              action={
                <Button variant="outline" onClick={() => void reload()}>
                  {tf('reload')}
                </Button>
              }
            />
          ) : (
            command.code && <AdminFailure code={command.code} />
          )}
        </div>
      </Sheet>
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title={tf('discard.title')}
        impact={tf('discard.impact')}
        cancelLabel={tf('discard.keep')}
        confirmLabel={tf('discard.confirm')}
        tone="danger"
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
      />
    </>
  );
}

/** Terms, Privacy, Refund and About: plain-text Markdown subset per slug,
 * sanitised by the server before storage and rendered without raw HTML. */
export function LegalPageEditor({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.legal');
  const tf = useTranslations('superAdmin.settings');
  const format = useFormatter();
  const [editing, setEditing] = useState<LegalSlug>();
  const [notice, setNotice] = useState<string>();
  const status = editing && data.legal.find((item) => item.slug === editing);
  return (
    <Card padded className="grid gap-3">
      <h2 className="text-h3">{tf('sections.legal')}</h2>
      <ul className="grid gap-2">
        {LEGAL_SLUGS.map((slug) => {
          const item = data.legal.find((entry) => entry.slug === slug);
          const published = Boolean(item?.page);
          return (
            <li
              key={slug}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="grid min-w-0 gap-1">
                <span className="font-semibold">{t(`pages.${slug}`)}</span>
                <span className="flex flex-wrap items-center gap-2 text-small text-muted">
                  <Badge
                    tone={published ? 'ok' : 'warn'}
                    icon={published ? '✓' : '!'}
                    label={t(published ? 'published' : 'notPublished')}
                  />
                  {item?.page &&
                    t('updated', {
                      date: format.dateTime(new Date(item.page.publishedAt), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Asia/Kolkata',
                      }),
                    })}
                </span>
              </div>
              <Button
                variant="outline"
                disabled={!item}
                aria-label={t('editAria', { page: t(`pages.${slug}`) })}
                onClick={() => {
                  setNotice(undefined);
                  setEditing(slug);
                }}
              >
                {tf('edit')}
              </Button>
            </li>
          );
        })}
      </ul>
      <Notice message={notice} />
      {status && (
        <Editor
          key={status.slug}
          status={status}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setNotice(t('saved', { page: t(`pages.${status.slug}`) }));
          }}
        />
      )}
    </Card>
  );
}
