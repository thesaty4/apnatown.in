'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import {
  SETTING_VALUE_SCHEMAS,
  type SettingKey,
  type SettingsGroup,
  type SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { queryKeys } from '../../../shared/api/query-keys';
import { AdminFailure, Alert, Notice, useAdmin } from '../../admin';
import { useIdempotentCommand } from '../queries';
import type { BrowserApi } from '../../../shared/api/browser';
import type { Command } from '../api';
import { putSetting, putSettingsGroup, type SettingUpdate } from './api';

/** Offending value paths, `key.path.to.field` (same shape as the server's). */
export type Issues = Set<string>;
type Values = Partial<Record<SettingKey, unknown>>;

export function valuesOf(
  data: SuperAdminSettings,
  keys: readonly SettingKey[],
) {
  const values: Values = {};
  for (const entry of data.settings)
    if (keys.includes(entry.key)) values[entry.key] = entry.value;
  return values;
}

function versionsOf(data: SuperAdminSettings, keys: readonly SettingKey[]) {
  const versions: Partial<Record<SettingKey, number>> = {};
  for (const entry of data.settings)
    if (keys.includes(entry.key)) versions[entry.key] = entry.version;
  return versions;
}

const money = /^\d{1,9}(?:\.\d{1,2})?$/;
const percent = /^\d{1,3}(?:\.\d{1,2})?$/;
const decimal = /^\d{1,4}(?:\.\d{1,2})?$/;
const whole = /^\d{1,10}$/;

/** Paise → editable rupees; empty when not configured. */
/** snake_case contract values → camelCase message-key segments. */
export const messageKey = (value: string) =>
  value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

export const rupees = (paise: number | null | undefined) =>
  paise == null ? '' : String(paise / 100);
/** Basis points → editable percent. */
export const percentOf = (bps: number | null | undefined) =>
  bps == null ? '' : String(bps / 100);
export const textOf = (value: number | null | undefined) =>
  value == null ? '' : String(value);

/** Rupees text → integer paise (no float rounding drift). */
export function toPaise(text: string, path: string, issues: Issues) {
  const value = text.trim();
  if (!money.test(value)) issues.add(path);
  const [units = '0', fraction = ''] = value.split('.');
  return Number(units) * 100 + Number(fraction.padEnd(2, '0') || '0');
}
/** Percent text → integer basis points. */
export function toBps(text: string, path: string, issues: Issues) {
  const value = text.trim();
  if (!percent.test(value)) issues.add(path);
  const [units = '0', fraction = ''] = value.split('.');
  return Number(units) * 100 + Number(fraction.padEnd(2, '0') || '0');
}
export function toNumber(
  text: string,
  path: string,
  issues: Issues,
  integer = true,
) {
  const value = text.trim();
  if (!(integer ? whole : decimal).test(value)) issues.add(path);
  return Number(value);
}
/** Optional text: blank is null (not configured). */
export const orNull = (text: string) => text.trim() || null;

// ---------------------------------------------------------------------------
// Unsaved-changes registry (section switch + page unload guard)
// ---------------------------------------------------------------------------

const DirtyContext = createContext<(id: string, dirty: boolean) => void>(
  () => {},
);
export const DirtyProvider = DirtyContext.Provider;
export function useReportDirty(id: string, dirty: boolean) {
  const report = useContext(DirtyContext);
  useEffect(() => {
    report(id, dirty);
    return () => report(id, false);
  }, [id, dirty, report]);
}

// ---------------------------------------------------------------------------
// One Save-bound form: a single key or one whole group
// ---------------------------------------------------------------------------

async function saveSettings(
  api: BrowserApi,
  body: { group: SettingsGroup | null; updates: SettingUpdate[] },
  command: Command,
) {
  if (body.group)
    return (
      await putSettingsGroup(
        api,
        { group: body.group, updates: body.updates },
        command,
      )
    ).values;
  const [update] = body.updates;
  if (!update) throw new Error('No setting to save');
  return [(await putSetting(api, update, command)).entry];
}

type Edit<F> = {
  form: F;
  base: F;
  versions: Partial<Record<SettingKey, number>>;
};

export type SectionForm<F> = ReturnType<typeof useSectionForm<F>>;

/** Draft over the server values. Saving sends every member with the version
 * the draft was based on; a conflict keeps the draft until Reload rebases it
 * on freshly hydrated versions (nothing is re-sent automatically). */
export function useSectionForm<F>({
  id,
  data,
  keys,
  group,
  toForm,
  toValues,
}: {
  id: string;
  data: SuperAdminSettings;
  keys: readonly SettingKey[];
  group: SettingsGroup | null;
  toForm: (values: Values) => F;
  toValues: (form: F, issues: Issues) => Values;
}) {
  const t = useTranslations('superAdmin.settings');
  const { scope } = useAdmin();
  const client = useQueryClient();
  const serverForm = toForm(valuesOf(data, keys));
  const [edit, setEdit] = useState<Edit<F> | null>(null);
  const [clientIssues, setClientIssues] = useState<Issues>(new Set());
  const [notice, setNotice] = useState<string>();
  const command = useIdempotentCommand(saveSettings);
  const form = edit?.form ?? serverForm;
  const dirty =
    edit !== null && JSON.stringify(edit.form) !== JSON.stringify(edit.base);
  useReportDirty(id, dirty);

  const issues: Issues = clientIssues.size
    ? clientIssues
    : new Set(command.code === 'SETTINGS_INVALID' ? command.fields : []);

  return {
    form,
    dirty,
    issues,
    notice,
    busy: command.busy,
    code: command.code,
    has: (path: string) => issues.has(path),
    change(update: (form: F) => F) {
      setNotice(undefined);
      setEdit((current) => {
        const next = current ?? {
          form: serverForm,
          base: serverForm,
          versions: versionsOf(data, keys),
        };
        return { ...next, form: update(next.form) };
      });
    },
    save() {
      const found: Issues = new Set();
      const values = toValues(form, found);
      for (const key of keys) {
        const parsed = SETTING_VALUE_SCHEMAS[key].safeParse(values[key]);
        if (!parsed.success)
          for (const issue of parsed.error.issues)
            found.add(
              [key, ...issue.path.filter((part) => typeof part !== 'symbol')]
                .map(String)
                .join('.'),
            );
      }
      setClientIssues(found);
      setNotice(undefined);
      if (found.size) return;
      const versions = edit?.versions ?? versionsOf(data, keys);
      command.submit(
        {
          group,
          updates: keys.map((key) => ({
            key,
            value: values[key],
            expectedVersion: versions[key] ?? 0,
          })),
        },
        () => {
          setEdit(null);
          setNotice(t('saved'));
        },
      );
    },
    /** Hydrate every fresh version, keep the draft, let the admin re-save. */
    async reload() {
      await client.refetchQueries({ queryKey: queryKeys.settings(scope) });
      const fresh = client.getQueryData<SuperAdminSettings>(
        queryKeys.settings(scope),
      );
      if (!fresh) return;
      setEdit(
        (current) =>
          current && {
            form: current.form,
            base: toForm(valuesOf(fresh, keys)),
            versions: versionsOf(fresh, keys),
          },
      );
      command.mutation.reset();
    },
  };
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

export function ConfiguredBadge({ configured }: { configured: boolean }) {
  const t = useTranslations('superAdmin.settings.status');
  return (
    <Badge
      tone={configured ? 'ok' : 'warn'}
      icon={configured ? '✓' : '!'}
      label={t(configured ? 'configured' : 'notConfigured')}
    />
  );
}

/** Exact missing readiness fields as setup tasks (never invented defaults). */
export function SetupTasks({ missing }: { missing: readonly string[] }) {
  const t = useTranslations('superAdmin.settings');
  if (!missing.length) return null;
  return (
    <div className="grid gap-1 rounded-md border border-warning bg-warning-soft p-3 text-text">
      <p className="font-semibold">{t('setup.title')}</p>
      <ul className="list-disc ps-5">
        {missing.map((field) => (
          <li key={field} className="[overflow-wrap:anywhere]">
            <code>{field}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FormCard<F>({
  title,
  section,
  saveLabel,
  rules,
  status,
  children,
}: {
  title: string;
  section: SectionForm<F>;
  saveLabel?: string;
  /** Localized message for a rule-level issue path, if any. */
  rules?: (path: string) => string | undefined;
  status?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('superAdmin.settings');
  const ref = useRef<HTMLFormElement>(null);
  const issueKey = [...section.issues].join('|');
  useEffect(() => {
    if (!issueKey) return;
    const target =
      ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      ref.current?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [issueKey]);
  const messages = [
    ...new Set(
      [...section.issues]
        .map((path) => rules?.(path))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const code = section.code;
  return (
    <Card padded className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {status}
          {section.dirty && <Badge tone="warn" icon="●" label={t('unsaved')} />}
        </div>
      </div>
      <form
        ref={ref}
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          section.save();
        }}
      >
        {children}
        {section.issues.size > 0 && (
          <div tabIndex={-1} className="grid gap-1">
            <Alert message={t('errors.summary')} />
            {messages.map((message) => (
              <p key={message} className="text-small text-error">
                {message}
              </p>
            ))}
          </div>
        )}
        {code === 'SETTINGS_VERSION_CONFLICT' ? (
          <Alert
            message={t('conflict')}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => void section.reload()}
              >
                {t('reload')}
              </Button>
            }
          />
        ) : (
          code && code !== 'SETTINGS_INVALID' && <AdminFailure code={code} />
        )}
        <Button
          type="submit"
          disabled={section.busy || !section.dirty}
          aria-busy={section.busy}
        >
          {section.busy ? t('saving') : (saveLabel ?? t('save'))}
        </Button>
      </form>
      <Notice message={section.notice} />
    </Card>
  );
}
