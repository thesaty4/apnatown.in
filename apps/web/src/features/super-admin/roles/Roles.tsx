'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { IdSchema } from '@apnatown/shared/wire';
import type { PermissionMatrix, Role } from '@apnatown/shared/admin';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  NotFoundState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../../shared/api/result';
import {
  AdminFailure,
  adminErrorKey,
  isDenied,
  Notice,
  samePermissions,
  useAdmin,
  usePermissionLabels,
} from '../../admin';
import { useAllRoles } from '../queries';
import { RoleEditor, type RoleDraft } from './RoleEditor';
import {
  CreateRoleSheet,
  DeleteRoleDialog,
  useDuplicateRole,
} from './RoleSheets';

const draftOf = (role: Role): RoleDraft => ({
  roleId: role.id,
  name: role.name,
  description: role.description ?? '',
  permissions: role.permissions,
});
export const isDirty = (draft: RoleDraft, role: Role) =>
  draft.name.trim() !== role.name ||
  (draft.description.trim() || null) !== role.description ||
  !samePermissions(draft.permissions, role.permissions);

/** S-SUPR-03 Roles and permissions. The open editor is URL state (`?edit=`);
 * the unsaved draft lives here so Back/Esc can ask before discarding it. */
export function Roles() {
  const { recheck } = useAdmin();
  const t = useTranslations('superAdmin.roles');
  const te = useTranslations('admin.errors');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('edit');
  const editId =
    requested && IdSchema.safeParse(requested).success ? requested : undefined;
  const { query, roles } = useAllRoles();
  const [draft, setDraft] = useState<RoleDraft>();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role>();
  const [notice, setNotice] = useState<string>();
  const role = editId ? roles.find((item) => item.id === editId) : undefined;
  const active = role && (draft?.roleId === role.id ? draft : draftOf(role));
  const draftRole = draft && roles.find((item) => item.id === draft.roleId);
  const dirty = Boolean(draft && draftRole && isDirty(draft, draftRole));

  const open = (id: string) =>
    router.push(`${pathname}?${new URLSearchParams({ edit: id })}`, {
      scroll: false,
    });
  const closeEditor = () => {
    setDraft(undefined);
    setDiscardOpen(false);
    router.push(pathname, { scroll: false });
  };
  const leave = () => (dirty ? setDiscardOpen(true) : closeEditor());

  // Browser Back left the editor with unsaved edits: restore it and ask.
  useEffect(() => {
    if (!editId && draft && dirty) {
      router.push(
        `${pathname}?${new URLSearchParams({ edit: draft.roleId })}`,
        {
          scroll: false,
        },
      );
      setDiscardOpen(true);
    } else if (!editId && draft) setDraft(undefined);
  }, [editId, draft, dirty, pathname, router]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const code = query.isError ? failureCode(query.error) : undefined;
  useEffect(() => {
    if (code && isDenied(code)) recheck();
  }, [code, recheck]);

  const duplicate = useDuplicateRole(() => setNotice(t('duplicated')));
  const onDeleted = (message: string) => {
    setDeleting(undefined);
    setNotice(message);
    if (editId) closeEditor();
  };

  let body;
  if (query.isPending || (query.hasNextPage && !query.isError))
    body = <Skeleton label={t('loading')} />;
  else if (code && isDenied(code))
    body = (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={te(adminErrorKey(code))}
        action={<Button onClick={recheck}>{t('checkAgain')}</Button>}
      />
    );
  else if (code && roles.length === 0)
    body = (
      <ErrorState
        title={t('errorTitle')}
        message={te(adminErrorKey(code))}
        action={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      />
    );
  else if (editId && !role)
    body = (
      <NotFoundState
        title={t('notFoundTitle')}
        message={t('notFoundMessage')}
        action={<Button onClick={closeEditor}>{t('allRoles')}</Button>}
      />
    );
  else if (role && active)
    body = (
      <RoleEditor
        key={role.id}
        role={role}
        draft={active}
        dirty={isDirty(active, role)}
        onChange={(patch) => setDraft({ ...active, ...patch })}
        onSaved={() => setDraft(undefined)}
        onBack={leave}
        onDuplicate={() => duplicate.duplicate(role)}
        duplicating={duplicate.busy}
        onDelete={() => setDeleting(role)}
        escapeBlocked={discardOpen || deleting !== undefined}
      />
    );
  else
    body = (
      <RoleList
        roles={roles}
        onOpen={open}
        onDuplicate={(item) => duplicate.duplicate(item)}
        duplicating={duplicate.busy}
        onDelete={setDeleting}
        onCreate={() => setCreateOpen(true)}
      />
    );

  return (
    <div className="grid gap-stack-gap">
      {!editId && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-h1">{t('title')}</h1>
          <Button
            onClick={() => {
              setNotice(undefined);
              setCreateOpen(true);
            }}
          >
            {t('newRole')}
          </Button>
        </div>
      )}
      <Notice message={notice} />
      {duplicate.code && <AdminFailure code={duplicate.code} />}
      {code && roles.length > 0 && (
        <AdminFailure
          code={code}
          retry={() => void query.refetch()}
          busy={query.isFetching}
        />
      )}
      {body}
      <CreateRoleSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false);
          setNotice(t('created'));
          open(created.id);
        }}
      />
      {deleting && (
        <DeleteRoleDialog
          key={deleting.id}
          role={roles.find((item) => item.id === deleting.id) ?? deleting}
          roles={roles}
          onClose={() => setDeleting(undefined)}
          onDeleted={onDeleted}
        />
      )}
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t('discardTitle')}
        impact={t('discardMessage')}
        cancelLabel={t('keepEditing')}
        confirmLabel={t('discard')}
        tone="danger"
        onConfirm={closeEditor}
      />
    </div>
  );
}

function PermissionBadges({ permissions }: { permissions: PermissionMatrix }) {
  const labels = usePermissionLabels();
  const t = useTranslations('superAdmin.roles');
  const granted = labels.granted(permissions);
  if (granted.length === 0)
    return <p className="text-small text-text-2">{t('noPermissions')}</p>;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {granted.map((module) => (
        <li key={module}>
          <Badge
            label={`${labels.module(module)}: ${labels.summary(permissions, module)}`}
          />
        </li>
      ))}
    </ul>
  );
}

function RoleList({
  roles,
  onOpen,
  onDuplicate,
  duplicating,
  onDelete,
  onCreate,
}: {
  roles: readonly Role[];
  onOpen: (id: string) => void;
  onDuplicate: (role: Role) => void;
  duplicating: boolean;
  onDelete: (role: Role) => void;
  onCreate: () => void;
}) {
  const t = useTranslations('superAdmin.roles');
  if (roles.length === 0)
    return (
      <EmptyState
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={<Button onClick={onCreate}>{t('newRole')}</Button>}
      />
    );
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {roles.map((role) => (
        <li key={role.id}>
          <Card padded className="grid gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="grid min-w-0 gap-1">
                <h2 className="text-h3">{role.name}</h2>
                {role.description && (
                  <p className="text-small text-text-2">{role.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {role.isSystem && (
                  <Badge tone="secondary" icon="🔒" label={t('systemRole')} />
                )}
                <Badge
                  icon="👥"
                  label={t('adminCount', { count: role.adminCount })}
                />
              </div>
            </div>
            <PermissionBadges permissions={role.permissions} />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                aria-label={t(role.isSystem ? 'viewName' : 'editName', {
                  name: role.name,
                })}
                onClick={() => onOpen(role.id)}
              >
                {t(role.isSystem ? 'view' : 'edit')}
              </Button>
              <Button
                variant="outline"
                disabled={duplicating}
                aria-label={t('duplicateName', { name: role.name })}
                onClick={() => onDuplicate(role)}
              >
                {t('duplicate')}
              </Button>
              <Button
                variant="danger"
                disabled={role.isSystem}
                aria-label={t('deleteName', { name: role.name })}
                aria-describedby={
                  role.isSystem ? `locked-${role.id}` : undefined
                }
                onClick={() => onDelete(role)}
              >
                {t('delete')}
              </Button>
            </div>
            {role.isSystem && (
              <p id={`locked-${role.id}`} className="text-small text-muted">
                {t('systemNoDelete')}
              </p>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
