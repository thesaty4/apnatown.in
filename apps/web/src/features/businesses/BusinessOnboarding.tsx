'use client';

import { useState } from 'react';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import type { MapConfiguration } from '@apnatown/ui/geo/MapView';
import { OwnerGate } from './BusinessDashboard';
import { DraftWizard } from './onboarding/DraftWizard';
import { StartWizard } from './onboarding/StartWizard';
import { StatusScreen, Submitted } from './onboarding/StatusScreens';
import { Frame } from './onboarding/WizardChrome';

/** S-VEND-01 / S-PROV-01 seven-step application wizard. */
export function BusinessOnboarding({
  kind,
  mapConfig,
}: {
  kind: BusinessKind;
  mapConfig: MapConfiguration;
}) {
  return (
    <Frame kind={kind}>
      <OwnerGate kind={kind} missing={() => <StartWizard kind={kind} />}>
        {(business) => (
          <Resume key={business.id} owner={business} mapConfig={mapConfig} />
        )}
      </OwnerGate>
    </Frame>
  );
}

/** Existing application: status screens or the resumable draft wizard. */
function Resume({
  owner,
  mapConfig,
}: {
  owner: BusinessOwner;
  mapConfig: MapConfiguration;
}) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return <Submitted kind={owner.kind} />;
  if (['draft', 'rejected', 'changes_requested'].includes(owner.status))
    return (
      <DraftWizard
        owner={owner}
        mapConfig={mapConfig}
        onSubmitted={() => setSubmitted(true)}
      />
    );
  return <StatusScreen owner={owner} />;
}
