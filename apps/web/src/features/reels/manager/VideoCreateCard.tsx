'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateVideoSchema, type CreateVideo } from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { Card } from '@apnatown/ui/cards/Card';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { useCreateOwnerVideo } from '../queries';
import { parseHashtags, sourceHostValid, type SourceKind } from './source';

const createError: Record<string, string> = {
  MEDIA_VIDEO_SOURCE_INVALID: 'sourceInvalid',
  USERS_APPROVAL_REQUIRED: 'approvalRequired',
  COMMON_RATE_LIMITED: 'rateLimited',
};

function buildInput(form: HTMLFormElement): CreateVideo | undefined {
  const values = new FormData(form);
  const kind = values.get('kind') === 'instagram' ? 'instagram' : 'youtube';
  const url = String(values.get('url') ?? '');
  if (!sourceHostValid(kind, url)) return undefined;
  const parsed = CreateVideoSchema.safeParse({
    source: { kind, url },
    caption: values.get('caption') ?? '',
    hashtags: parseHashtags(String(values.get('hashtags') ?? '')),
    showInGallery: values.get('showInGallery') === 'on',
    showInReels: values.get('showInReels') === 'on',
  });
  return parsed.success ? parsed.data : undefined;
}

/** Add a YouTube/Instagram link; it starts pending until admin approval. */
export function VideoCreateCard({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('reels.manager');
  const tv = useTranslations('vendor.media.create');
  const online = useOnline();
  const form = useRef<HTMLFormElement>(null);
  const headingId = useId();
  const [source, setSource] = useState<SourceKind>('youtube');
  const [formInvalid, setFormInvalid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const create = useCreateOwnerVideo(kind);
  const code = create.mutation.isError
    ? failureCode(create.mutation.error)
    : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = buildInput(event.currentTarget);
    setSubmitted(false);
    setFormInvalid(!body);
    if (!body) return;
    create.submit(body, () => {
      form.current?.reset();
      setSource('youtube');
      setSubmitted(true);
    });
  }

  return (
    <Card padded className="grid gap-4">
      <div className="grid gap-1">
        <h2 id={headingId} className="m-0 text-h3">
          {tv('title')}
        </h2>
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {t('intro')}
        </p>
      </div>
      <form
        ref={form}
        aria-labelledby={headingId}
        onSubmit={submit}
        noValidate
        className="grid gap-4"
      >
        <div className="grid gap-4 tablet:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
          <Select
            name="kind"
            label={t('sourceKind')}
            value={source}
            onChange={(event) =>
              setSource(event.currentTarget.value === 'instagram' ? 'instagram' : 'youtube')
            }
            options={[
              { value: 'youtube', label: t('youtube') },
              { value: 'instagram', label: t('instagram') },
            ]}
          />
          <Input
            name="url"
            type="url"
            inputMode="url"
            label={t('sourceUrl')}
            hint={tv(`urlHint.${source}`)}
            required
            maxLength={2048}
            autoComplete="url"
            error={formInvalid ? t('errors.validation') : undefined}
          />
        </div>
        <Input name="caption" label={t('caption')} maxLength={300} />
        <Input name="hashtags" label={t('hashtags')} hint={t('hashtagsHint')} />
        <div className="grid gap-2 tablet:grid-cols-2">
          <Switch name="showInGallery" label={t('showInGallery')} />
          <Switch name="showInReels" label={t('showInReels')} />
        </div>
        {code && (
          <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
            {t(`errors.${createError[code] ?? 'failed'}`)}
          </p>
        )}
        {submitted && (
          <p role="status" className="m-0 text-success [overflow-wrap:anywhere]">
            ✓ {t('submitted')}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            loading={create.mutation.isPending}
            disabled={!online}
          >
            {t(create.mutation.isPending ? 'submitting' : 'submit')}
          </Button>
          {!online && (
            <p role="status" className="m-0 text-small text-warning">
              {tv('offline')}
            </p>
          )}
        </div>
      </form>
      <FileUploadDisabled />
    </Card>
  );
}

/** Direct video files are outside launch scope (links only), stated plainly. */
function FileUploadDisabled() {
  const t = useTranslations('vendor.media.create');
  const noteId = useId();
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-dashed border-border bg-surface-2 px-3.5 py-3">
      <Button
        type="button"
        variant="ghost"
        disabled
        aria-describedby={noteId}
        className="gap-2"
      >
        <NavIcon name="upload" className="size-4.5" />
        {t('fileUpload')}
      </Button>
      <p
        id={noteId}
        className="m-0 min-w-0 flex-1 basis-56 text-small text-text-2 [overflow-wrap:anywhere]"
      >
        {t('fileUploadScope')}
      </p>
    </div>
  );
}
