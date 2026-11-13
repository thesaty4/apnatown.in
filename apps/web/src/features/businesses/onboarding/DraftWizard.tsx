'use client';

import { useTranslations } from 'next-intl';
import type { BusinessOwner } from '@apnatown/shared/businesses';
import { Button } from '@apnatown/ui/primitives/Button';
import type { MapConfiguration } from '@apnatown/ui/geo/MapView';
import { DraftAlerts, DraftStatusText } from '../DraftFeedback';
import { ExpertiseSection } from '../ExpertiseSection';
import { Alert, StatusBanner, errorKey } from '../parts';
import { DescriptionField, NameFields } from '../sections/BasicsFields';
import { CategoryPicker } from '../sections/CategoryPicker';
import { ContactFields } from '../sections/ContactFields';
import { DeliveryFields, ServiceAreaFields } from '../sections/DeliveryFields';
import { HoursEditor } from '../sections/HoursEditor';
import { LocationFields } from '../sections/LocationFields';
import { DocumentsStep } from './DocumentsStep';
import { MobileStep } from './MobileStep';
import { Review } from './ReviewStep';
import type { Step } from './steps';
import { TypeStep } from './TypeStep';
import { useDraftWizard } from './use-draft-wizard';
import { Nav, Progress, StepHeading } from './WizardChrome';

type Wizard = ReturnType<typeof useDraftWizard>;

/** Draft / rejected / changes-requested: the resumable seven-step wizard. */
export function DraftWizard({
  owner,
  mapConfig,
  onSubmitted,
}: {
  owner: BusinessOwner;
  mapConfig: MapConfiguration;
  onSubmitted: () => void;
}) {
  const t = useTranslations('business.onboarding');
  const te = useTranslations('business.errors');
  const wizard = useDraftWizard(owner, onSubmitted);
  const { step, setStep, draft, current, busy, errorCode } = wizard;
  return (
    <>
      <StatusBanner business={current} hideFinish />
      <Progress step={step} />
      <StepHeading step={step} />
      <StepBody wizard={wizard} mapConfig={mapConfig} />
      <DraftAlerts draft={draft} />
      {errorCode && (
        <Alert tone="bad" role="alert">
          <p className="m-0">{te(errorKey(errorCode))}</p>
        </Alert>
      )}
      {step === 7 && !current.capabilities.submit && (
        <Alert tone="info" role="note">
          <p className="m-0">{t('cannotSubmit')}</p>
        </Alert>
      )}
      <Nav
        step={step}
        busy={busy}
        onBack={() => setStep((step - 1) as Step)}
        saveDraft={
          step >= 3 && wizard.editable && !draft.conflict
            ? () => void draft.save()
            : undefined
        }
        status={
          <DraftStatusText draft={draft} savedKey="onboarding.draftSaved" />
        }
        next={<NextButton wizard={wizard} />}
      />
    </>
  );
}

function NextButton({ wizard }: { wizard: Wizard }) {
  const t = useTranslations('business.onboarding');
  const { step, busy, draft, current } = wizard;
  return step === 7 ? (
    <Button
      loading={wizard.submitting}
      disabled={busy || draft.conflict || !current.capabilities.submit}
      onClick={() => void wizard.finish()}
    >
      {t('submit')}
    </Button>
  ) : (
    <Button
      disabled={busy || draft.conflict}
      loading={draft.saving}
      onClick={() => void wizard.next()}
    >
      {t('next')}
    </Button>
  );
}

function StepBody({
  wizard,
  mapConfig,
}: {
  wizard: Wizard;
  mapConfig: MapConfiguration;
}) {
  const t = useTranslations('business.onboarding');
  const { kind, step, section, current } = wizard;
  return (
    <>
      {step === 1 && <MobileStep />}
      {step === 2 && (
        <TypeStep
          kind={kind}
          locked={!current.capabilities.changeKind}
          onChoose={wizard.chooseKind}
        />
      )}
      {step === 3 && (
        <div className="grid gap-3">
          <NameFields {...section} />
          <CategoryPicker {...section} />
          <DescriptionField {...section} />
        </div>
      )}
      {step === 3 && kind === 'provider' && <ExpertiseSection />}
      {step === 4 && (
        <div className="grid gap-3">
          <LocationFields
            {...section}
            mapConfig={mapConfig}
            pinLabel={t(kind === 'shop' ? 'pinShop' : 'pinProvider')}
          />
          <ContactFields {...section} />
        </div>
      )}
      {step === 5 && (
        <div className="grid gap-4">
          <HoursEditor {...section} />
          {kind === 'shop' ? (
            <DeliveryFields {...section} />
          ) : (
            <ServiceAreaFields {...section} />
          )}
        </div>
      )}
      {step === 6 && <DocumentsStep kind={kind} />}
      {step === 7 && (
        <Review owner={current} draft={wizard.draft} onEdit={wizard.setStep} />
      )}
    </>
  );
}
