'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import { Button } from '@apnatown/ui/primitives/Button';
import type { MapConfiguration } from '@apnatown/ui/geo/MapView';
import { OwnerGate } from './BusinessDashboard';
import { DraftAlerts, DraftStatusText } from './DraftFeedback';
import { ExpertiseSection } from './ExpertiseSection';
import { DescriptionField, NameFields } from './sections/BasicsFields';
import { CategoryPicker } from './sections/CategoryPicker';
import { ContactFields } from './sections/ContactFields';
import { DeliveryFields, ServiceAreaFields } from './sections/DeliveryFields';
import { HoursEditor } from './sections/HoursEditor';
import { ImageSlots, type ImageSlot } from './sections/ImageSlots';
import { LocationFields } from './sections/LocationFields';
import { FormCard } from './sections/shared';
import { ProfilePreview } from './ProfilePreview';
import { Alert, BusinessStatusBadge, StatusBanner } from './parts';
import { useReactivateBusiness } from './queries';
import { useProfileDraft } from './use-profile-draft';

/** S-VEND-12 / S-PROV-09 business profile editor. */
export function BusinessProfileEditor({
  kind,
  mapConfig,
}: {
  kind: BusinessKind;
  mapConfig: MapConfiguration;
}) {
  return (
    <OwnerGate kind={kind}>
      {(business) => (
        <Editor key={business.id} owner={business} mapConfig={mapConfig} />
      )}
    </OwnerGate>
  );
}

function Editor({
  owner,
  mapConfig,
}: {
  owner: BusinessOwner;
  mapConfig: MapConfiguration;
}) {
  const t = useTranslations('business.profile');
  const kind = owner.kind;
  const draft = useProfileDraft(owner);
  const reactivate = useReactivateBusiness(kind);
  const current = draft.synced;
  const editable = current.capabilities.editProfile;
  const disabled = !editable || draft.saving;
  // Save waits until every chosen logo/cover file has a server asset ID.
  const [uploading, setUploading] = useState<Record<ImageSlot, boolean>>({
    logo: false,
    cover: false,
  });
  const imagesBusy = uploading.logo || uploading.cover;
  const section = {
    form: draft.form,
    set: draft.set,
    errors: draft.errors,
    disabled,
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!editable || draft.conflict || imagesBusy) return;
    void draft.save();
  }

  return (
    <div className="grid min-w-0 gap-4">
      <header className="flex min-w-0 flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="m-0 text-h1">
            {t(kind === 'shop' ? 'titleShop' : 'titleProvider')}
          </h1>
          <p className="m-0 text-small text-text-2">{t('subtitle')}</p>
        </div>
        <BusinessStatusBadge status={current.status} />
      </header>
      <StatusBanner
        business={current}
        reactivating={reactivate.mutation.isPending}
        onReactivate={() =>
          void reactivate.run(current.version, (next) => draft.adopt(next))
        }
      />
      {current.status === 'pending' && (
        <Alert tone="info" role="note" title={t('pendingEditTitle')}>
          <p className="m-0">{t('pendingEdit')}</p>
        </Alert>
      )}
      {!editable && (
        <Alert tone="info" role="note">
          <p className="m-0">{t('readOnly')}</p>
        </Alert>
      )}
      <div className="grid min-w-0 items-start gap-4 desktop:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid min-w-0 gap-4">
          <form noValidate onSubmit={submit} className="grid min-w-0 gap-4">
            <FormCard title={t('basicDetails')}>
              <ImageSlots
                {...section}
                kind={kind}
                businessId={current.id}
                canUpload={editable && current.capabilities.uploadMedia}
                onPendingChange={(slot, pending) =>
                  setUploading((state) => ({ ...state, [slot]: pending }))
                }
              />
              <NameFields {...section} />
              <CategoryPicker {...section} />
              <DescriptionField {...section} />
            </FormCard>
            <FormCard title={t('contact')}>
              <ContactFields {...section} />
            </FormCard>
            <FormCard title={t('location')}>
              <LocationFields
                {...section}
                mapConfig={mapConfig}
                pinLabel={t(kind === 'shop' ? 'pinShop' : 'pinProvider')}
              />
            </FormCard>
            <FormCard title={t('hours')}>
              <HoursEditor {...section} />
            </FormCard>
            {kind === 'shop' ? (
              <FormCard title={t('delivery')}>
                <DeliveryFields {...section} />
              </FormCard>
            ) : (
              <FormCard title={t('serviceArea')}>
                <ServiceAreaFields {...section} />
              </FormCard>
            )}
            <div className="sticky bottom-0 z-10 -mx-1 grid gap-2 rounded-md border border-border bg-surface p-3 shadow-2 desktop:static desktop:border-0 desktop:bg-transparent desktop:p-0 desktop:shadow-none">
              <DraftAlerts draft={draft} />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    !editable || draft.conflict || draft.saving || imagesBusy
                  }
                  loading={draft.saving}
                >
                  {t('save')}
                </Button>
                {imagesBusy ? (
                  <p role="status" className="m-0 text-small text-text-2">
                    {t('waitForUploads')}
                  </p>
                ) : (
                  <DraftStatusText draft={draft} />
                )}
              </div>
            </div>
          </form>
          {kind === 'provider' && (
            // Server decides expertise editability (403 → locked state).
            <ExpertiseSection />
          )}
        </div>
        <aside className="min-w-0 desktop:sticky desktop:top-4">
          <ProfilePreview
            kind={kind}
            form={draft.form}
            verified={current.status === 'approved'}
          />
        </aside>
      </div>
    </div>
  );
}
