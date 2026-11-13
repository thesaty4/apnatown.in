'use client';

import { useTranslations } from 'next-intl';
import {
  VideoEditSchema,
  type MediaLinkTarget,
  type OwnerVideoDetail,
  type VideoEdit,
} from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { OwnerImageField } from '../../media/owner-images';
import { linkKey } from './gallery-queries';
import { LinkedItemsPicker } from './LinkedItemsPicker';
import {
  canonicalSourceUrl,
  formatHashtags,
  parseHashtags,
  sameList,
  sourceHostValid,
  type SourceKind,
} from './source';

export type EditorForm = {
  source: SourceKind;
  url: string;
  thumbnail: string | null;
  caption: string;
  hashtags: string;
  links: MediaLinkTarget[];
  showInGallery: boolean;
  showInReels: boolean;
};
export type EditorField = 'url' | 'caption' | 'hashtags' | 'links' | 'thumbnail';
export type EditorIssues = Partial<Record<EditorField, string>>;

export function toEditorForm(detail: OwnerVideoDetail): EditorForm {
  const { video } = detail;
  return {
    source: video.provider,
    url: canonicalSourceUrl(video),
    thumbnail: detail.thumbnail?.assetId ?? null,
    caption: video.caption,
    hashtags: formatHashtags(video.hashtags),
    links: detail.links,
    showInGallery: video.showInGallery,
    showInReels: video.showInReels,
  };
}

/** Only changed fields are sent: a toggle-only save keeps an approval. */
export function buildEdit(
  detail: OwnerVideoDetail,
  form: EditorForm,
  resubmit: boolean,
): { body: VideoEdit; content: boolean } | { issues: EditorIssues } {
  const initial = toEditorForm(detail);
  const issues: EditorIssues = {};
  const sourceChanged =
    form.source !== initial.source || form.url.trim() !== initial.url;
  if (sourceChanged && !sourceHostValid(form.source, form.url))
    issues.url = 'sourceHost';
  const tags = parseHashtags(form.hashtags);
  if (tags.length > 10 || tags.some((tag) => tag.length > 40))
    issues.hashtags = 'hashtags';
  if (form.caption.trim().length > 300) issues.caption = 'caption';
  if (form.links.length > 10) issues.links = 'links';
  if (Object.keys(issues).length > 0) return { issues };

  const body: VideoEdit = { expectedVersion: detail.video.version };
  if (sourceChanged) body.source = { kind: form.source, url: form.url.trim() };
  if (form.thumbnail !== initial.thumbnail) body.thumbnailAssetId = form.thumbnail;
  if (form.caption.trim() !== detail.video.caption) body.caption = form.caption.trim();
  if (!sameList(tags, detail.video.hashtags)) body.hashtags = tags;
  if (!sameList(form.links.map(linkKey), initial.links.map(linkKey)))
    body.links = form.links;
  const content = Object.keys(body).length > 1;
  if (form.showInGallery !== initial.showInGallery)
    body.showInGallery = form.showInGallery;
  if (form.showInReels !== initial.showInReels) body.showInReels = form.showInReels;
  if (resubmit) body.resubmit = true;
  const parsed = VideoEditSchema.safeParse(body);
  return parsed.success ? { body: parsed.data, content } : { issues: { url: 'validation' } };
}

/** Editor fields (prototype vmedia card content as a form). */
export function VideoEditorFields({
  kind,
  businessId,
  form,
  onChange,
  issues,
  disabled,
  onThumbnailPending,
}: {
  kind: BusinessKind;
  businessId: string;
  form: EditorForm;
  onChange: (patch: Partial<EditorForm>) => void;
  issues: EditorIssues;
  disabled: boolean;
  onThumbnailPending: (pending: boolean) => void;
}) {
  const t = useTranslations('vendor.media.editor');
  const tr = useTranslations('reels.manager');
  const issue = (field: EditorField) => {
    const key = issues[field];
    if (!key) return undefined;
    return key.startsWith('server:') ? key.slice(7) : t(`issues.${key}`);
  };
  return (
    <div className="grid gap-5">
      <fieldset className="m-0 grid gap-3 border-0 p-0" disabled={disabled}>
        <legend className="mb-1 p-0 text-h4">{t('sourceSection')}</legend>
        <div className="grid gap-3 tablet:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
          <Select
            label={tr('sourceKind')}
            value={form.source}
            onChange={(event) =>
              onChange({
                source: event.currentTarget.value === 'instagram' ? 'instagram' : 'youtube',
              })
            }
            options={[
              { value: 'youtube', label: tr('youtube') },
              { value: 'instagram', label: tr('instagram') },
            ]}
          />
          <Input
            type="url"
            inputMode="url"
            label={tr('sourceUrl')}
            hint={t('sourceHint')}
            maxLength={2048}
            value={form.url}
            error={issue('url')}
            onChange={(event) => onChange({ url: event.currentTarget.value })}
          />
        </div>
      </fieldset>

      <OwnerImageField
        purpose="video_thumbnail"
        businessId={businessId}
        label={t('thumbnail')}
        value={form.thumbnail}
        disabled={disabled}
        error={issue('thumbnail')}
        onPendingChange={onThumbnailPending}
        onChange={(thumbnail) => onChange({ thumbnail })}
      />

      <fieldset className="m-0 grid gap-3 border-0 p-0" disabled={disabled}>
        <legend className="mb-1 p-0 text-h4">{t('detailsSection')}</legend>
        <TextArea
          label={tr('caption')}
          hint={t('captionHint', { count: form.caption.trim().length })}
          maxLength={300}
          value={form.caption}
          error={issue('caption')}
          onChange={(event) => onChange({ caption: event.currentTarget.value })}
        />
        <Input
          label={tr('hashtags')}
          hint={tr('hashtagsHint')}
          value={form.hashtags}
          error={issue('hashtags')}
          onChange={(event) => onChange({ hashtags: event.currentTarget.value })}
        />
      </fieldset>

      <LinkedItemsPicker
        kind={kind}
        value={form.links}
        disabled={disabled}
        error={issue('links')}
        onChange={(links) => onChange({ links })}
      />

      <fieldset className="m-0 grid gap-1 border-0 p-0" disabled={disabled}>
        <legend className="mb-1 p-0 text-h4">{t('visibilitySection')}</legend>
        <Switch
          label={tr('showInGallery')}
          checked={form.showInGallery}
          onChange={(event) => onChange({ showInGallery: event.currentTarget.checked })}
        />
        <Switch
          label={tr('showInReels')}
          checked={form.showInReels}
          onChange={(event) => onChange({ showInReels: event.currentTarget.checked })}
        />
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {t('visibilityHint')}
        </p>
      </fieldset>
    </div>
  );
}
