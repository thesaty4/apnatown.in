import type {
  NotificationCategory,
  NotificationChannelKind,
  NotificationIntent,
  NotificationTemplateKey,
  NotificationTopic,
} from '@apnatown/shared/notifications';

/**
 * Trusted matrix policy per template (spec "Channel/topic policy"): S
 * (system/approval/review/admin) = in_app + email; E (enquiries) = in_app +
 * email + whatsapp(wa_enq). Callers never choose category/topic/intent.
 */
export interface TemplatePolicy {
  category: NotificationCategory;
  topic: NotificationTopic;
  intent: NotificationIntent;
  channels: readonly NotificationChannelKind[];
}
const SYSTEM = Object.freeze(['in_app', 'email'] as const);
const ENQUIRIES = Object.freeze(['in_app', 'email', 'whatsapp'] as const);
// O (orders): in-app + email (email stays suppressed until a provider exists);
// WhatsApp order updates await an approved template + order_updates consent.
const ORDERS = Object.freeze(['in_app', 'email'] as const);
export const TEMPLATE_POLICY: Readonly<
  Record<NotificationTemplateKey, TemplatePolicy>
> = Object.freeze({
  'admin.alert': { category: 'admin', topic: 'system', intent: 'transactional', channels: SYSTEM },
  'approval.decided': { category: 'approval', topic: 'system', intent: 'transactional', channels: SYSTEM },
  'enquiry.new': { category: 'enquiry', topic: 'enquiries', intent: 'transactional', channels: ENQUIRIES },
  'subcategory.decided': { category: 'approval', topic: 'system', intent: 'transactional', channels: SYSTEM },
  'comment.decided': { category: 'system', topic: 'system', intent: 'transactional', channels: SYSTEM },
  'support.received': { category: 'admin', topic: 'system', intent: 'transactional', channels: SYSTEM },
  'order.new': { category: 'order', topic: 'orders', intent: 'transactional', channels: ORDERS },
  'order.status': { category: 'order', topic: 'orders', intent: 'transactional', channels: ORDERS },
  'order.cancelled': { category: 'order', topic: 'orders', intent: 'transactional', channels: ORDERS },
});

/** Logical content identity for template notices (campaigns use their own). */
export const TEMPLATE_CONTENT_VERSION = 'template';

/**
 * Localized values for code params. Rendering substitutes only these (or a
 * stored catalog name); unknown codes render as an empty string, never raw.
 * TODO(verify): Hindi copy pending content review.
 */
const VOCABULARY: Readonly<Record<string, Record<'en' | 'hi', string>>> = {
  'subject.business_application': { en: 'shop application', hi: 'दुकान आवेदन' },
  'subject.provider_application': { en: 'provider application', hi: 'सेवा प्रदाता आवेदन' },
  'subject.subcategory_suggestion': { en: 'subcategory suggestion', hi: 'उपश्रेणी सुझाव' },
  'subject.video_comment': { en: 'video comment', hi: 'वीडियो टिप्पणी' },
  'status.approved': { en: 'approved', hi: 'स्वीकृत हुआ' },
  'status.rejected': { en: 'rejected', hi: 'अस्वीकृत हुआ' },
  'status.merged': { en: 'merged into an existing subcategory', hi: 'मौजूदा उपश्रेणी में जोड़ा गया' },
  'status.changes_requested': { en: 'changes requested', hi: 'बदलाव आवश्यक' },
  'status.suspended': { en: 'suspended', hi: 'निलंबित' },
  'status.inactive': { en: 'inactive', hi: 'निष्क्रिय' },
  'status.published': { en: 'published', hi: 'प्रकाशित हुई' },
  'status.removed': { en: 'removed', hi: 'हटा दी गई' },
  'status.accepted': { en: 'accepted by the shop', hi: 'दुकान ने स्वीकार कर लिया है' },
  'status.preparing': { en: 'being prepared', hi: 'तैयार किया जा रहा है' },
  'status.ready': { en: 'ready', hi: 'तैयार है' },
  'status.ready_for_pickup': { en: 'ready for pickup', hi: 'पिकअप के लिए तैयार है' },
  'status.out_for_delivery': { en: 'out for delivery', hi: 'डिलीवरी के लिए निकल चुका है' },
  'status.delivered': { en: 'delivered', hi: 'डिलीवर हो गया है' },
  'status.picked_up': { en: 'picked up', hi: 'पिकअप हो गया है' },
  'status.cancelled': { en: 'cancelled', hi: 'रद्द कर दिया गया है' },
};

/** Params that are free catalog names (suggestion name) rather than codes. */
const NAME_PARAMS = new Set(['name']);
/** Literal non-PII references rendered verbatim only when they match the shape. */
const LITERAL_PARAMS: Readonly<Record<string, RegExp>> = {
  orderNumber: /^[A-Z0-9-]{1,24}$/,
};
const PLACEHOLDER = /\{([a-z][a-zA-Z]{0,30})\}/g;

export function renderTemplate(
  text: string,
  params: Readonly<Record<string, unknown>>,
  locale: 'en' | 'hi',
): string {
  return text.replace(PLACEHOLDER, (_match, name: string) => {
    const value = params[name];
    if (typeof value !== 'string') return '';
    const literal = LITERAL_PARAMS[name];
    if (literal) return literal.test(value) ? value : '';
    if (NAME_PARAMS.has(name)) {
      const localized = params[`${name}_${locale}`];
      return (typeof localized === 'string' ? localized : value).slice(0, 80);
    }
    return VOCABULARY[`${name}.${value}`]?.[locale] ?? '';
  });
}
