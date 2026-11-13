import {
  ENQUIRY_STATUS_TRANSITIONS,
  type EnquiryStatus,
  type EnquiryTargetStatus,
} from '@apnatown/shared/services';
import type { EnquiryInboxRow } from './enquiry-ports';

/** Outbox aggregate type of every enquiry event. */
export const ENQUIRY_AGGREGATE = 'service_enquiry';

/** AEAD associated data binding a phone ciphertext to its enquiry row. */
export const enquiryPhoneContext = (enquiryId: string) =>
  `enquiry:${enquiryId}:phone`;

/** Next ST-enquiry statuses reachable from `status`. */
export function allowedStatuses(status: EnquiryStatus): EnquiryTargetStatus[] {
  return [...ENQUIRY_STATUS_TRANSITIONS[status]] as EnquiryTargetStatus[];
}

/** Inbox item wire shape (never includes the phone). */
export function enquiryItemDto(row: EnquiryInboxRow) {
  return {
    id: row.id,
    service: {
      id: row.serviceId,
      slug: row.serviceSlug,
      nameEn: row.serviceNameEn,
      nameHi: row.serviceNameHi,
    },
    name: row.name,
    message: row.message,
    preferredDate: row.preferredDate,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
  };
}
