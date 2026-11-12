'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  CreateAdminSchema,
  type AdminCard,
  type AreaRef,
} from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { failureCode } from '../../../shared/api/result';
import {
  AdminFailure,
  PermissionGrid,
  samePermissions,
  togglePermission,
  useAdmin,
} from '../../admin';
import { geoName } from '../../geo/api';
import {
  createAdmin,
  setAdminAreas,
  setAdminPermissions,
  setAdminRole,
  setAdminStatus,
} from '../api';
import { impactOptions, useAllRoles, useIdempotentCommand } from '../queries';
import { AreaPicker } from './AreaPicker';

type SheetProps = {
  card: AdminCard;
  onClose: () => void;
  onDone: (message: string) => void;
};

function SheetFooter({
  busy,
  disabled,
  onCancel,
  label,
  form,
}: {
  busy: boolean;
  disabled: boolean;
  onCancel: () => void;
  label: string;
  form: string;
}) {
  const t = useTranslations('superAdmin.sheet');
  return (
    <div className="flex items-center gap-row-gap">
      <Button
        variant="ghost"
        className="min-w-0 flex-1"
        disabled={busy}
        onClick={onCancel}
      >
        {t('cancel')}
      </Button>
      <Button
        type="submit"
        form={form}
        className="min-w-0 flex-1"
        loading={busy}
        disabled={disabled}
      >
        {label}
      </Button>
    </div>
  );
}

function CommsNote({ card }: { card: AdminCard }) {
  const t = useTranslations('superAdmin.admins');
  return (
    <p className="text-small text-text-2">
      {t('commsKept', {
        scopes: card.communicationScopes.length
          ? card.communicationScopes
              .map((scope) => t(`comms.${scope}`))
              .join(', ')
          : t('none'),
      })}
    </p>
  );
}

type CreateDraft = {
  phone: string;
  email: string;
  displayName: string;
  roleId: string;
  areas: AreaRef[];
};
const emptyDraft: CreateDraft = {
  phone: '',
  email: '',
  displayName: '',
  roleId: '',
  areas: [],
};
const createFields = {
  phone: 'phoneInvalid',
  email: 'emailInvalid',
  displayName: 'nameInvalid',
  roleId: 'roleRequired',
  areaIds: 'areasInvalid',
} as const;
type CreateField = keyof typeof createFields;
const isCreateField = (value: unknown): value is CreateField =>
  typeof value === 'string' && value in createFields;

export function CreateAdminSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations('superAdmin.create');
  const { roles, query: rolesQuery } = useAllRoles();
  const [draft, setDraft] = useState(emptyDraft);
  const [invalid, setInvalid] = useState<CreateField[]>([]);
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof createAdmin>[1], cmd) =>
      createAdmin(api, body, cmd),
  );
  const serverInvalid = command.code
    ? command.fields.filter(isCreateField)
    : [];
  const error = (field: CreateField) =>
    invalid.includes(field) || serverInvalid.includes(field)
      ? t(createFields[field])
      : undefined;
  const update = (patch: Partial<CreateDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = CreateAdminSchema.safeParse({
      phone: draft.phone.replace(/[\s-]/g, ''),
      email: draft.email.trim(),
      displayName: draft.displayName.trim(),
      roleId: draft.roleId,
      areaIds: draft.areas.map((area) => area.id),
    });
    if (!parsed.success) {
      setInvalid(
        parsed.error.issues.map((issue) => issue.path[0]).filter(isCreateField),
      );
      return;
    }
    setInvalid([]);
    command.submit(parsed.data, () => {
      setDraft(emptyDraft);
      onCreated();
    });
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('title')}
      closeLabel={t('close')}
      busy={command.busy}
      wide
      footer={
        <SheetFooter
          form="create-admin"
          busy={command.busy}
          disabled={false}
          onCancel={onClose}
          label={t('submit')}
        />
      }
    >
      <form
        id="create-admin"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        <Input
          label={t('displayName')}
          required
          autoComplete="off"
          maxLength={60}
          value={draft.displayName}
          error={error('displayName')}
          onChange={(event) => update({ displayName: event.target.value })}
        />
        <Input
          label={t('phone')}
          type="tel"
          inputMode="tel"
          required
          autoComplete="off"
          hint={t('phoneHint')}
          maxLength={14}
          value={draft.phone}
          error={error('phone')}
          onChange={(event) => update({ phone: event.target.value })}
        />
        <Input
          label={t('email')}
          type="email"
          required
          autoComplete="off"
          maxLength={254}
          value={draft.email}
          error={error('email')}
          onChange={(event) => update({ email: event.target.value })}
        />
        <Select
          label={t('role')}
          required
          value={draft.roleId}
          disabled={rolesQuery.isPending}
          error={error('roleId')}
          options={[
            { value: '', label: t('rolePlaceholder') },
            ...roles.map((role) => ({ value: role.id, label: role.name })),
          ]}
          onChange={(event) => update({ roleId: event.target.value })}
        />
        {rolesQuery.isError && (
          <AdminFailure
            code={failureCode(rolesQuery.error)}
            retry={() => void rolesQuery.refetch()}
            busy={rolesQuery.isFetching}
          />
        )}
        <AreaPicker
          value={draft.areas}
          onChange={(areas) => update({ areas })}
          disabled={command.busy}
          error={error('areaIds')}
        />
        {command.code && <AdminFailure code={command.code} />}
      </form>
    </Sheet>
  );
}

export function AreasSheet({ card, onClose, onDone }: SheetProps) {
  const t = useTranslations('superAdmin.admins');
  const [areas, setAreas] = useState<AreaRef[]>(card.areas);
  const command = useIdempotentCommand(
    (api, body: { areaIds: string[]; expectedVersion: number }, cmd) =>
      setAdminAreas(api, card.id, body, cmd),
  );
  const unchanged =
    areas.length === card.areas.length &&
    areas.every((area) => card.areas.some((item) => item.id === area.id));
  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={t('areasFor', { name: card.name })}
      closeLabel={t('close')}
      busy={command.busy}
      wide
      footer={
        <SheetFooter
          form="admin-areas"
          busy={command.busy}
          disabled={unchanged}
          onCancel={onClose}
          label={t('save')}
        />
      }
    >
      <form
        id="admin-areas"
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          command.submit(
            {
              areaIds: areas.map((area) => area.id),
              expectedVersion: card.version,
            },
            () => onDone(t('areasSaved', { name: card.name })),
          );
        }}
      >
        <AreaPicker value={areas} onChange={setAreas} disabled={command.busy} />
        {command.code && <AdminFailure code={command.code} />}
      </form>
    </Sheet>
  );
}

export function PermissionsSheet({ card, onClose, onDone }: SheetProps) {
  const t = useTranslations('superAdmin.admins');
  const [permissions, setPermissions] = useState(card.permissions);
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof setAdminPermissions>[2], cmd) =>
      setAdminPermissions(api, card.id, body, cmd),
  );
  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={t('permissionsFor', { name: card.name })}
      closeLabel={t('close')}
      busy={command.busy}
      wide
      footer={
        <SheetFooter
          form="admin-permissions"
          busy={command.busy}
          disabled={samePermissions(permissions, card.permissions)}
          onCancel={onClose}
          label={t('save')}
        />
      }
    >
      <form
        id="admin-permissions"
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          command.submit({ permissions, expectedVersion: card.version }, () =>
            onDone(t('permissionsSaved', { name: card.name })),
          );
        }}
      >
        <PermissionGrid
          value={permissions}
          disabled={command.busy}
          onToggle={(module, action, checked) =>
            setPermissions((current) =>
              togglePermission(current, module, action, checked),
            )
          }
        />
        <CommsNote card={card} />
        {command.code && <AdminFailure code={command.code} />}
      </form>
    </Sheet>
  );
}

export function RoleSheet({ card, onClose, onDone }: SheetProps) {
  const t = useTranslations('superAdmin.admins');
  const { roles, query } = useAllRoles();
  const [roleId, setRoleId] = useState(card.role.id);
  const [reseed, setReseed] = useState(false);
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof setAdminRole>[2], cmd) =>
      setAdminRole(api, card.id, body, cmd),
  );
  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={t('roleFor', { name: card.name })}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <SheetFooter
          form="admin-role"
          busy={command.busy}
          disabled={roleId === card.role.id && !reseed}
          onCancel={onClose}
          label={t('save')}
        />
      }
    >
      <form
        id="admin-role"
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          command.submit(
            {
              roleId,
              reseedPermissions: reseed,
              expectedVersion: card.version,
            },
            () => onDone(t('roleSaved', { name: card.name })),
          );
        }}
      >
        <Select
          label={t('role')}
          value={roleId}
          disabled={command.busy || query.isPending}
          options={[
            ...roles.map((role) => ({ value: role.id, label: role.name })),
            ...(roles.some((role) => role.id === card.role.id)
              ? []
              : [{ value: card.role.id, label: card.role.name }]),
          ]}
          onChange={(event) => setRoleId(event.target.value)}
        />
        {query.isError && (
          <AdminFailure
            code={failureCode(query.error)}
            retry={() => void query.refetch()}
            busy={query.isFetching}
          />
        )}
        <Checkbox
          label={t('reseed')}
          description={t('reseedHint')}
          checked={reseed}
          disabled={command.busy}
          onChange={(event) => setReseed(event.target.checked)}
        />
        <CommsNote card={card} />
        {command.code && <AdminFailure code={command.code} />}
      </form>
    </Sheet>
  );
}

/** Deactivation shows the server impact first; confirming stays disabled
 * until it loads. Open cases are never shown as 0 when unavailable. */
export function StatusDialog({ card, onClose, onDone }: SheetProps) {
  const context = useAdmin();
  const t = useTranslations('superAdmin.status');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const deactivate = card.status === 'active';
  const impact = useQuery({
    ...impactOptions(context, card.id),
    enabled: deactivate,
  });
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof setAdminStatus>[2], cmd) =>
      setAdminStatus(api, card.id, body, cmd),
  );
  return (
    <ConfirmDialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={t(deactivate ? 'deactivateTitle' : 'activateTitle', {
        name: card.name,
      })}
      impact={t(deactivate ? 'deactivateImpact' : 'activateImpact', {
        name: card.name,
      })}
      cancelLabel={t('cancel')}
      confirmLabel={t(deactivate ? 'confirmDeactivate' : 'confirmActivate')}
      tone={deactivate ? 'danger' : 'primary'}
      busy={command.busy}
      confirmDisabled={deactivate && !impact.data}
      onConfirm={() =>
        command.submit(
          {
            status: deactivate ? 'inactive' : 'active',
            expectedVersion: card.version,
          },
          () =>
            onDone(
              t(deactivate ? 'deactivated' : 'activated', { name: card.name }),
            ),
        )
      }
    >
      {deactivate &&
        (impact.isPending ? (
          <Skeleton label={t('impactLoading')} />
        ) : impact.isError ? (
          <AdminFailure
            code={failureCode(impact.error)}
            retry={() => void impact.refetch()}
            busy={impact.isFetching}
          />
        ) : (
          <dl className="m-0 grid gap-3 rounded-md bg-surface-2 p-3">
            <div className="grid gap-1">
              <dt className="font-semibold">{t('uncovered')}</dt>
              <dd className="m-0 text-text-2">
                {impact.data.areasLeftWithoutActiveAdmin.length
                  ? impact.data.areasLeftWithoutActiveAdmin
                      .map((area) => geoName(area, locale))
                      .join(', ')
                  : t('noneUncovered')}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-semibold">{t('openCases')}</dt>
              <dd className="m-0 text-text-2">
                {impact.data.openCasesInScope === null
                  ? t('unavailable')
                  : impact.data.openCasesInScope}
              </dd>
            </div>
          </dl>
        ))}
      {command.code && <AdminFailure code={command.code} />}
    </ConfirmDialog>
  );
}
