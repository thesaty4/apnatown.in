'use client';

import type { ServiceOwner } from '@apnatown/shared/services';
import { useServicePrice, useTaxonomyNames } from './parts';
import { ServiceRow } from './ServiceRow';

/** Renders the owner service cards; row actions are delegated to the manager. */
export function ServiceRows({
  items,
  busy,
  pendingId,
  publicLive,
  onToggle,
  onEdit,
  onCopy,
  onDelete,
}: {
  items: ServiceOwner[];
  busy: boolean;
  /** Row whose status switch is currently saving. */
  pendingId: string | null;
  publicLive: boolean;
  onToggle: (service: ServiceOwner, next: ServiceOwner['status']) => void;
  onEdit: (service: ServiceOwner) => void;
  onCopy: (service: ServiceOwner) => void;
  onDelete: (service: ServiceOwner) => void;
}) {
  const taxonomy = useTaxonomyNames(items);
  const price = useServicePrice();
  return (
    <>
      {items.map((service) => (
        <ServiceRow
          key={service.id}
          service={service}
          taxonomy={taxonomy(service)}
          price={price(service)}
          busy={busy}
          statusPending={pendingId === service.id}
          publicHref={
            publicLive && service.status === 'active'
              ? `/service/${encodeURIComponent(service.slug)}`
              : null
          }
          onToggle={(next) => onToggle(service, next)}
          onEdit={() => onEdit(service)}
          onCopy={() => onCopy(service)}
          onDelete={() => onDelete(service)}
        />
      ))}
    </>
  );
}
