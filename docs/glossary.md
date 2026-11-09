# Glossary

English/Hindi terms used across product, code and copy. Use these exact
terms for consistency (`i18n-a11y.instructions.md`). Hindi examples here
are the only Hindi content allowed outside message catalogs (`en.json`
/ `hi.json`) and translator-reviewed copy.

## Core terms

| English | Hindi (Devanagari) | Definition |
|---|---|---|
| Shop / Business | दुकान | A vendor's storefront profile listing products |
| Service provider | सेवा प्रदाता | A provider's profile listing services |
| Product | उत्पाद | A sellable physical item with stock |
| Service | सेवा | A bookable/enquiry-based offering, one subcategory each |
| Order | ऑर्डर | A single-shop purchase with its own status |
| Enquiry | पूछताछ | A service lead, not a purchase |
| Home delivery | होम डिलीवरी | Rider brings the order to the customer |
| Self-pickup | सेल्फ पिकअप | Customer collects from the shop |
| Rider | राइडर | Delivery partner |
| Delivery OTP | डिलीवरी ओटीपी | 6-digit code verifying handover to the customer |
| Pickup code | पिकअप कोड | Code verifying self-pickup collection |
| Offer | ऑफर | Discount applied to product/service/shop |
| Review | समीक्षा | Rating + text from a verified purchaser/enquirer |
| Reels / Videos | रील्स / वीडियो | Short-form video content |
| Follow | फॉलो करें | Subscribe to an owner's updates |
| Bookmark / Save | सेव करें | Save a business/product/service for later |
| Approved | स्वीकृत | Application state allowing selling/accepting orders |
| Pending | लंबित | Application/content awaiting a decision |
| Rejected | अस्वीकृत | Application/content declined, with a reason |
| Suspended | निलंबित | Temporarily blocked account |
| City / Zone | शहर / ज़ोन | Geographic scope for delivery and admin access |

## Microcopy tone and guidance

- **Tone:** plain, respectful, local-shopkeeper warmth — not corporate,
  not cute. Avoid jargon; a first-time online shopper must understand
  every message.
- **Parity:** every English string has a reviewed Hindi string of
  equal meaning; do not machine-translate without review before
  shipping to production.
- **Length tolerance:** Hindi text is often 30-60% longer than English
  — write components to wrap, not truncate (`i18n-a11y.instructions.md`).
- **Numbers, money, dates:** always run through the shared formatters
  (`packages/shared`) — INR paise -> `₹1,25,000`, UTC -> IST 12-hour.

### Message pattern examples

| Type | English | Hindi |
|---|---|---|
| Error (retryable) | "Something went wrong. Please try again." | "कुछ गड़बड़ हो गई। कृपया फिर से प्रयास करें।" |
| Empty state | "No shops found nearby yet." | "आस-पास अभी कोई दुकान नहीं मिली।" |
| Success | "Order placed! We'll notify you at every step." | "ऑर्डर हो गया! हम आपको हर कदम पर सूचित करेंगे।" |
| Permission denied | "You don't have permission to do this." | "आपको यह करने की अनुमति नहीं है।" |
| Confirm (destructive) | "Deactivate this admin? They will lose access immediately." | "इस एडमिन को निष्क्रिय करें? उनकी पहुंच तुरंत समाप्त हो जाएगी।" |
| Outside service area | "We are not in your city yet." | "हम अभी आपके शहर में नहीं हैं।" |
| Awaiting moderation | "Your comment is awaiting moderation." | "आपकी टिप्पणी मॉडरेशन की प्रतीक्षा में है।" |

See `i18n-a11y.instructions.md` for key-naming conventions and the
long-Hindi-text checklist.
