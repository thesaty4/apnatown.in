'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  type PermissionMatrix,
  type Role,
  type RoleUpdateResult,
} from '@apnatown/shared/admin';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Card } from '@apnatown/ui/cards/Card';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import {
  AdminFailure,
  changedModules,
  Notice,
  PermissionGrid,
  togglePermission,
  usePermissionLabels,
} from '../../admin';
import { updateRole, type UpdateRoleBody } from '../api';
import { useIdempotentCommand } from '../queries';
import { roleFieldErrors } from './RoleSheets';

export type RoleDraft = {
  roleId: string;
  name: string;
  description: string;
  permissions: PermissionMatrix;
};
type Snapshot = {
  name: string;
  description: string | null;
  permissions: PermissionMatrix;
};

/** Normalized before/after rows; "No changes" when equal. */
function Summary({ before, after }: { before: Snapshot; after: Snapshot }) {
  const t = useTranslations('superAdmin.roles');
  const labels = usePermissionLabels();
  const rows = [
    ...(before.name !== after.name
      ? [
          {
            key: 'name',
            label: t('name'),
            before: before.name,
            after: after.name,
          },
        ]
      : []),
    ...(before.description !== after.description
      ? [
          {
            key: 'description',
            label: t('description'),
            before: before.description ?? '—',
            after: after.description ?? '—',
          },
        ]
      : []),
    ...changedModules(before.permissions, after.permissions).map((module) => ({
      key: module,
      label: labels.module(module),
      before: labels.summary(before.permissions, module),
      after: labels.summary(after.permissions, module),
    })),
  ];
  if (rows.length === 0) return <p className="text-text-2">{t('noChanges')}</p>;
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-small">
        <thead>
          <tr className="bg-surface-2">
            <th scope="col" className="p-2 text-start">
              {t('field')}
            </th>
            <th scope="col" className="p-2 text-start">
              {t('before')}
            </th>
            <th scope="col" className="p-2 text-start">
              {t('after')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border">
              <th scope="row" className="p-2 text-start font-medium">
                {row.label}
              </th>
              <td className="p-2 text-text-2 [overflow-wrap:anywhere]">
                {row.before}
              </td>
              <td className="p-2 [overflow-wrap:anywhere]">{row.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RoleEditor({
  role,
  draft,
  dirty,
  onChange,
  onSaved,
  onBack,
  onDuplicate,
  duplicating,
  onDelete,
  escapeBlocked,
}: {
  role: Role;
  draft: RoleDraft;
  dirty: boolean;
  onChange: (patch: Partial<RoleDraft>) => void;
  onSaved: () => void;
  onBack: () => void;
  onDuplicate: () => void;
  duplicating: boolean;
  onDelete: () => void;
  escapeBlocked: boolean;
}) {
  const t = useTranslations('superAdmin.roles');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saved, setSaved] = useState<RoleUpdateResult['summary']>();
  const command = useIdempotentCommand((api, body: UpdateRoleBody, cmd) =>
    updateRole(api, role.id, body, cmd),
  );
  const locked = role.isSystem;
  const invalid = roleFieldErrors(draft.name, draft.description);
  const after: Snapshot = {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    permissions: draft.permissions,
  };
  const before: Snapshot = {
    name: role.name,
    description: role.description,
    permissions: role.permissions,
  };

  // Esc outside any open dialog behaves like Back (dialogs consume their own Esc).
  useEffect(() => {
    if (reviewOpen || escapeBlocked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onBack();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [reviewOpen, escapeBlocked, onBack]);

  function save() {
    // Only changed fields are sent; the server normalizes and re-checks the version.
    const body: UpdateRoleBody = { expectedVersion: role.version };
    if (after.name !== before.name) body.name = after.name;
    if (after.description !== before.description)
      body.description = after.description;
    if (changedModules(before.permissions, after.permissions).length)
      body.permissions = after.permissions;
    command.submit(body, (result) => {
      setReviewOpen(false);
      setSaved(result.summary);
      onSaved();
    });
  }

  return (
    <div className="grid gap-stack-gap">
      <div>
        <Button variant="text" onClick={onBack}>
          ← {t('allRoles')}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-h1">{t(locked ? 'viewRole' : 'editRole')}</h1>
        {locked && <Badge tone="secondary" icon="🔒" label={t('systemRole')} />}
        {dirty && <Badge tone="warn" icon="●" label={t('unsaved')} />}
      </div>
      {locked && <p className="text-text-2">{t('systemLocked')}</p>}
      <Notice message={saved ? t('saved') : undefined} />
      {saved && (
        <Card padded className="grid gap-2">
          <h2 className="text-h4">{t('savedSummary')}</h2>
          <Summary before={saved.before} after={saved.after} />
        </Card>
      )}
      <Card padded className="grid gap-3">
        <Input
          label={t('name')}
          required
          maxLength={40}
          value={draft.name}
          readOnly={locked}
          error={
            !locked && invalid.name
              ? t('nameInvalid')
              : command.code === 'ROLE_NAME_TAKEN'
                ? t('nameTaken')
                : undefined
          }
          onChange={(event) => {
            setSaved(undefined);
            onChange({ name: event.target.value });
          }}
        />
        <TextArea
          label={t('description')}
          maxLength={200}
          value={draft.description}
          readOnly={locked}
          error={
            !locked && invalid.description ? t('descriptionInvalid') : undefined
          }
          onChange={(event) => {
            setSaved(undefined);
            onChange({ description: event.target.value });
          }}
        />
        <PermissionGrid
          value={draft.permissions}
          disabled={locked || command.busy}
          onToggle={(module, action, checked) => {
            setSaved(undefined);
            onChange({
              permissions: togglePermission(
                draft.permissions,
                module,
                action,
                checked,
              ),
            });
          }}
        />
        {command.code && command.code !== 'ROLE_NAME_TAKEN' && !reviewOpen && (
          <AdminFailure code={command.code} />
        )}
      </Card>
      <div className="flex flex-wrap gap-2">
        {!locked && (
          <Button
            disabled={invalid.name || invalid.description}
            onClick={() => setReviewOpen(true)}
          >
            {t('review')}
          </Button>
        )}
        <Button variant="outline" loading={duplicating} onClick={onDuplicate}>
          {t('duplicate')}
        </Button>
        <Button
          variant="danger"
          disabled={locked}
          aria-describedby={locked ? 'role-locked-delete' : undefined}
          onClick={onDelete}
        >
          {t('delete')}
        </Button>
      </div>
      {locked && (
        <p id="role-locked-delete" className="text-small text-muted">
          {t('systemNoDelete')}
        </p>
      )}
      <Sheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title={t('reviewTitle')}
        closeLabel={t('close')}
        busy={command.busy}
        wide
        footer={
          <div className="flex items-center gap-row-gap">
            <Button
              variant="ghost"
              className="min-w-0 flex-1"
              disabled={command.busy}
              onClick={() => setReviewOpen(false)}
            >
              {t('keepEditing')}
            </Button>
            <Button
              className="min-w-0 flex-1"
              loading={command.busy}
              disabled={!dirty}
              onClick={save}
            >
              {t('confirmSave')}
            </Button>
          </div>
        }
      >
        <Summary before={before} after={after} />
        {command.code && <AdminFailure code={command.code} />}
      </Sheet>
    </div>
  );
}
