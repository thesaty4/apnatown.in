import {
  EnquiryCreateSchema,
  EnquiryCreatedSchema,
  EnquiryDetailSchema,
  EnquiryInboxPageSchema,
  EnquiryStatusCommandSchema,
  EnquiryStatusResultSchema,
  type EnquiryCreate,
  type EnquiryStatus,
  type EnquiryStatusCommand,
} from '@apnatown/shared/services';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { BrowserApi } from '../../shared/api/browser';
import { normalizeFailure, unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;

/** Inbox page size (API default; max 50). */
export const ENQUIRY_PAGE_SIZE = 20;

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

/** Every owner route names its application kind explicitly, exactly like the
 * businesses owner calls, so an owner of both kinds never mixes contexts. */
const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

/**
 * Public guest enquiry (S-CUST-09). One Idempotency-Key per user intent: a
 * retry of the identical payload replays the stored 201 instead of creating a
 * second enquiry. Name/phone/message are never logged or sent elsewhere.
 */
export async function createEnquiry(
  api: BrowserApi,
  serviceId: string,
  input: EnquiryCreate,
  key: string,
) {
  const { preferredDate, ...required } = EnquiryCreateSchema.parse(input);
  const body = { ...required, ...(preferredDate ? { preferredDate } : {}) };
  try {
    const header = {
      ...(await api.mutationHeaders()),
      'Idempotency-Key': key,
    };
    return unwrap(
      await api.POST('/services/{serviceId}/enquiries', {
        params: { header, path: { serviceId } },
        body,
      }),
      EnquiryCreatedSchema,
    );
  } catch (error) {
    throw normalizeFailure(error);
  }
}

export type InboxFilters = {
  status: EnquiryStatus | undefined;
  query: string;
};

export async function listEnquiries(
  api: Reader,
  kind: BusinessKind,
  { status, query }: InboxFilters,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/enquiries', {
      params: {
        header: kindHeader(kind),
        query: {
          ...(status && { status }),
          ...(query && { query }),
          ...(cursor && { cursor }),
          limit: ENQUIRY_PAGE_SIZE,
        },
      },
      ...withSignal(signal),
    }),
    EnquiryInboxPageSchema,
  );
}

export async function getEnquiry(
  api: Reader,
  kind: BusinessKind,
  enquiryId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/enquiries/{enquiryId}', {
      params: { header: kindHeader(kind), path: { enquiryId } },
      ...withSignal(signal),
    }),
    EnquiryDetailSchema,
  );
}

export async function patchEnquiryStatus(
  api: BrowserApi,
  kind: BusinessKind,
  enquiryId: string,
  command: EnquiryStatusCommand,
  assertCurrent: () => void,
) {
  const body = EnquiryStatusCommandSchema.parse(command);
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PATCH('/businesses/me/enquiries/{enquiryId}/status', {
      params: {
        header: { ...header, ...kindHeader(kind) },
        path: { enquiryId },
      },
      body,
    }),
    EnquiryStatusResultSchema,
  );
}

// --- Phone and date helpers -----------------------------------------------

const OWNER_PHONE = /^\+91([6-9]\d{9})$/u;

/**
 * Accepts the prototype's 10-digit entry plus common pasted forms (spaces,
 * dashes, `+91`, `91`, leading `0`) and returns the bare 10-digit mobile the
 * shared schema accepts, or `undefined` when it is not a valid Indian mobile.
 */
export function normalizeMobile(input: string): string | undefined {
  let digits = input.replace(/[\s\-().]/gu, '');
  if (/^\+91\d{10}$/u.test(digits)) digits = digits.slice(3);
  else if (/^91\d{10}$/u.test(digits)) digits = digits.slice(2);
  else if (/^0\d{10}$/u.test(digits)) digits = digits.slice(1);
  return /^[6-9]\d{9}$/u.test(digits) ? digits : undefined;
}

/** `+91 98765 43210` for display; anything unexpected is shown verbatim. */
export function formatPhone(e164: string) {
  const match = OWNER_PHONE.exec(e164);
  if (!match) return e164;
  const national = match[1]!;
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}

/** User-initiated call link; only a validated +91 mobile ever becomes a URL. */
export function telHref(e164: string) {
  return OWNER_PHONE.test(e164) ? `tel:${e164}` : undefined;
}

/** `https://wa.me/<digits>?text=…`: digits come from the validated number and
 * the prefilled text is always percent-encoded. */
export function whatsappHref(e164: string, text: string) {
  if (!OWNER_PHONE.test(e164)) return undefined;
  return `https://wa.me/${e164.replace(/\D/gu, '')}?text=${encodeURIComponent(text)}`;
}

/** Today's calendar date in IST as `YYYY-MM-DD` (date input `min`). */
export function istDateToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
