# 09 — Content, i18n, Notifications

**Purpose:** Tone of voice, the EN/HI glossary, microcopy patterns, formats, and every notification/communication template.
**Audience:** Content writers, frontend engineers, `i18n-en-hi` skill users.
**Related files:** [docs/PROJECT.md](../PROJECT.md) (index) · [`docs/glossary.md`](../glossary.md) (short pointer to this file) · [04-business-rules.md](./04-business-rules.md) (BR-22) · [`i18n-a11y.instructions.md`](../../.github/instructions/i18n-a11y.instructions.md) · [`.github/skills/i18n-en-hi/SKILL.md`](../../.github/skills/i18n-en-hi/SKILL.md)
**Last updated:** 2026-11-09
**Owner:** Content

> This is now the **single canonical** glossary and content-tone
> reference. `docs/glossary.md` is a short pointer here.

## 1. Tone of voice

Friendly, simple, Hinglish-aware — speak like a helpful neighbour,
short sentences.

- **Error pattern:** what happened + what to do.
- **Empty pattern:** friendly + one clear action.
- Never blame the user.

## 2. Glossary (English | Hindi | definition)

| English | Hindi | Definition |
|---|---|---|
| Shop | दुकान | A vendor's storefront profile listing products |
| Service provider | सेवा प्रदाता | A provider's profile listing services |
| Order | ऑर्डर | A single-shop purchase with its own status (BR-03) |
| Cart | कार्ट | Items grouped by business before checkout |
| Delivery | डिलीवरी | Rider brings the order to the customer |
| Self-pickup | सेल्फ-पिकअप | Customer collects from the shop |
| Offer | ऑफ़र | Discount applied to a product/service/shop |
| Follow | फ़ॉलो | Subscribe to an owner's updates |
| Following | Following *(same in Hindi UI)* | The feed of followed owners |
| Saved | सहेजा | Bookmarked businesses/providers/services |
| Reviews | समीक्षाएँ | Rating + text from a verified purchaser/enquirer |
| Enquiry | पूछताछ | A service lead, not a purchase |
| Category | श्रेणी | Fixed top-level grouping (BR-07) |
| Subcategory | उप-श्रेणी | Admin-managed grouping under a category |
| Refund | रिफ़ंड | Money returned after a cancellation/dispute |
| OTP | OTP | One-time code for login/delivery/pickup (BR-05) |
| Pickup code | पिकअप कोड | Code verifying self-pickup collection |
| Verified | वेरिफ़ाइड | Business/provider identity confirmed |
| Open now | अभी खुला | Currently within opening hours |
| Nearby | आसपास | Within the selected distance radius |
| Filters | फ़िल्टर | Narrow results by category, price, rating, etc. |
| Apply | लागू करें | Confirm selected filters |
| Reset | रीसेट | Clear filters back to default |
| Clear all | सब हटाएँ | Remove all active filter chips |
| Select all | सभी चुनें | Check every option in a filter group |
| Add to cart | कार्ट में डालें | Add a product to the cart |
| Buy now | अभी खरीदें | Skip the cart, go straight to checkout |
| Send enquiry | पूछताछ भेजें | Submit the enquiry form |
| Log in | लॉग इन | Mobile OTP sign-in |
| Language | भाषा | EN/HI toggle |
| Rider | राइडर | Delivery partner |
| City / Zone | शहर / ज़ोन | Geographic scope for delivery and admin access |
| Approved | स्वीकृत | Application state allowing selling/accepting orders |
| Pending | लंबित | Application/content awaiting a decision |
| Rejected | अस्वीकृत | Application/content declined, with a reason |
| Suspended | निलंबित | Temporarily blocked account |

## 3. Microcopy patterns (EN | HI)

| Type | English | Hindi |
|---|---|---|
| Empty | "Nothing here yet. Add your first item." | "यहाँ अभी कुछ नहीं है। पहला आइटम जोड़ें।" |
| Error (payment) | "Payment failed. Your money is safe. Try again or pay on delivery." | "पेमेंट नहीं हुआ। आपका पैसा सुरक्षित है। फिर कोशिश करें या डिलीवरी पर दें।" |
| Success | "Order placed! The shop has been notified." | "ऑर्डर हो गया! दुकान को खबर कर दी गई है।" |
| Permission | "Allow location to see shops near you. You can browse without it." | "पास की दुकानें देखने के लिए लोकेशन दें। बिना लोकेशन भी देख सकते हैं।" |
| Confirm | "Cancel this order?" | "यह ऑर्डर रद्द करें?" |
| Cancellation (BR-20) | "Admin and vendor have been notified and will contact you to resolve it." | "एडमिन और दुकानदार को सूचना दे दी गई है। वे समाधान के लिए आपसे संपर्क करेंगे।" |
| Outside area | "We are not in your city yet" | "हम अभी आपके शहर में नहीं हैं" |

## 4. Formats

Currency `₹1,25,000` · Date `7 Nov 2026` · Time `2:17 PM` IST (BR-02) ·
Phone `+91 98765 43210` · Distance `1.4 km` · 12-hour clock · Hindi
digits not required.

## 5. Notification templates (X12)

| Event | In-app (EN) | In-app (HI) | WhatsApp | Email subject |
|---|---|---|---|---|
| Order placed | "Order AT10231 placed." | "ऑर्डर AT10231 हो गया।" | "Hi {name}, your order {id} from {shop} is placed. Total {amt}." | "Order {id} confirmed" |
| Out for delivery | "Rider {rider} is on the way. OTP {otp}." | "राइडर {rider} रास्ते में है। OTP {otp}।" | "Your order {id} is out for delivery. Share OTP {otp} at the door." | "Your order is on the way" |
| Delivered | "Delivered! Rate your order." | "डिलीवर हो गया! रेटिंग दें।" | "Order {id} delivered. Tell us how it went: {link}" | "Rate order {id}" |
| Cancelled/refund | "Order cancelled. Admin and vendor have been notified." | "ऑर्डर रद्द। एडमिन और दुकान को सूचना दी गई।" | "Your order {id} is cancelled. We will contact you about the refund." | "Order {id} cancelled" |
| Approval decision | "Your business was approved." | "आपका बिज़नेस स्वीकृत हुआ।" | "{shop}, you are now live on ApnaTown." | "You are approved" |
| New enquiry | "New enquiry from {name}." | "{name} की नई पूछताछ।" | "New enquiry on ApnaTown: {msg}" | "New enquiry" |

Also to be templated (not yet drafted — add before launch): subcategory
approved/rejected/merged, video approved/rejected/removed, offer
approved/rejected, rider assigned, refund approved, follower
announcement.

## 6. Admin communication templates (AD12)

Offer, New product, Festival greeting, Delay apology — variables
`{shop} {offer} {link}`. WhatsApp templates need prior provider
approval. Every message includes **"Reply STOP to opt out"**
(BR-11).
