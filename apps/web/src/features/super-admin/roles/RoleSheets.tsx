'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateRoleSchema, type Role } from '@apnatown/shared/admin';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Alert, AdminFailure } from '../../admin';
import { createRole, deleteRole, duplicateRole } from '../api';
import { useIdempotentCommand } from '../queries';

/** Shared name/description validation (same schema the API applies). */
export function roleFieldErrors(name: string, description: string) {
  const parsed = CreateRoleSchema.safeParse({
    name,
    description: description.trim() || null,
    permissions: {},
  });
  const paths = parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path[0]);
  return {
    name: paths.includes('name'),
    description: paths.includes('description'),
  };
}

export function CreateRoleSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (role: Role) => void;
}) {
  const t = useTranslations('superAdmin.roles');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [checked, setChecked] = useState(false);
  const command = useIdempotentCommand(
    (api, body: Parameters<typeof createRole>[1], cmd) =>
      createRole(api, body, cmd),
  );
  const invalid = checked
    ? roleFieldErrors(name, description)
    : { name: false, description: false };
  function submit(event: FormEvent) {
    event.preventDefault();
    setChecked(true);
    const errors = roleFieldErrors(name, description);
    if (errors.name || errors.description) return;
    command.submit(
      {
        name: name.trim(),
        description: description.trim() || null,
        permissions: {},
      },
      (role) => {
        setName('');
        setDescription('');
        setChecked(false);
        onCreated(role);
      },
    );
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('createTitle')}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <div className="flex items-center gap-row-gap">
          <Button
            variant="ghost"
            className="min-w-0 flex-1"
            disabled={command.busy}
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="create-role"
            className="min-w-0 flex-1"
            loading={command.busy}
          >
            {t('create')}
          </Button>
        </div>
      }
    >
      <form
        id="create-role"
        noValidate
        className="grid gap-3"
        onSubmit={submit}
      >
        <Input
          label={t('name')}
          required
          maxLength={40}
          value={name}
          error={
            invalid.name
              ? t('nameInvalid')
              : command.code === 'ROLE_NAME_TAKEN'
                ? t('nameTaken')
                : undefined
          }
          onChange={(event) => setName(event.target.value)}
        />
        <TextArea
          label={t('description')}
          maxLength={200}
          value={description}
          error={invalid.description ? t('descriptionInvalid') : undefined}
          onChange={(event) => setDescription(event.target.value)}
        />
        <p className="text-small text-text-2">{t('createHint')}</p>
        {command.code && command.code !== 'ROLE_NAME_TAKEN' && (
          <AdminFailure code={command.code} />
        )}
      </form>
    </Sheet>
  );
}

export function useDuplicateRole(onDone: (role: Role) => void) {
  const command = useIdempotentCommand((api, body: { id: string }, cmd) =>
    duplicateRole(api, body.id, cmd),
  );
  return {
    ...command,
    duplicate: (role: Role) => command.submit({ id: role.id }, onDone),
  };
}

/** Plain confirm when unused; a reassign picker when admins still hold the
 * role (known count or a ROLE_IN_USE answer). System roles never get here. */
export function DeleteRoleDialog({
  role,
  roles,
  onClose,
  onDeleted,
}: {
  role: Role;
  roles: readonly Role[];
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const t = useTranslations('superAdmin.roles');
  const [target, setTarget] = useState('');
  const command = useIdempotentCommand(
    (api, body: { reassignTo?: string }, cmd) =>
      deleteRole(api, role.id, body.reassignTo, cmd),
  );
  const inUse = role.adminCount > 0 || command.code === 'ROLE_IN_USE';
  const others = roles.filter((item) => item.id !== role.id);
  if (!inUse)
    return (
      <ConfirmDialog
        open
        onOpenChange={(next) => !next && onClose()}
        title={t('deleteTitle', { name: role.name })}
        impact={t('deleteImpact')}
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        tone="danger"
        busy={command.busy}
        onConfirm={() => command.submit({}, () => onDeleted(t('deleted')))}
      >
        {command.code && <AdminFailure code={command.code} />}
      </ConfirmDialog>
    );
  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={t('reassignTitle', { count: role.adminCount })}
      closeLabel={t('close')}
      busy={command.busy}
      footer={
        <div className="flex items-center gap-row-gap">
          <Button
            variant="ghost"
            className="min-w-0 flex-1"
            disabled={command.busy}
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            type="submit"
            form="reassign-role"
            className="min-w-0 flex-1"
            loading={command.busy}
            disabled={!target}
          >
            {t('reassignDelete')}
          </Button>
        </div>
      }
    >
      <form
        id="reassign-role"
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (target)
            command.submit({ reassignTo: target }, () =>
              onDeleted(t('reassigned')),
            );
        }}
      >
        <Alert
          message={t('inUse', { name: role.name, count: role.adminCount })}
        />
        <Select
          label={t('moveTo')}
          required
          value={target}
          disabled={command.busy}
          options={[
            { value: '', label: t('chooseRole') },
            ...others.map((item) => ({ value: item.id, label: item.name })),
          ]}
          onChange={(event) => setTarget(event.target.value)}
        />
        {command.code && command.code !== 'ROLE_IN_USE' && (
          <AdminFailure code={command.code} />
        )}
      </form>
    </Sheet>
  );
}
