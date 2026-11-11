# 09 Content and i18n

- **Purpose:** Tone, formats, microcopy, notification templates and the i18n contract.
- **Audience:** Frontend/backend developers, content owners, Copilot agents
- **Related:** 09a-i18n-en-hi.json (927 EN->HI strings extracted from the design), 05-design-system.md
- **Last updated:** 2026-11-10

## 1. i18n contract
- Two locales: `en`, `hi`. Every user-facing string is a key with both values; no hard-coded text; no sentence concatenation (ICU placeholders and plurals). Seed the catalogues from `09a-i18n-en-hi.json` (English text is the source key; convert to semantic keys such as `explore.empty.title`).
- Backend returns stable `code` values and message keys; clients localise. Notification templates exist in both languages.
- Hindi text may be about 30% longer: wrap, no fixed heights, no truncation of meaningful labels. Hindi translations need human review before launch (see Open issues).
- Default language: English; remembered per user/device; switchable everywhere.

## 2. Formats
Currency `₹1,25,000` (Indian grouping, from integer paise). Dates `7 Nov 2026`. Time `2:17 PM` IST 12-hour. Phone `+91 98765 43210` (store E.164). Distance `1.4 km`. Ratings one decimal with count `4.6 (63)`. Percent `10% OFF`. Hindi digits not required.

## 3. Tone
Friendly, simple, Hinglish-aware; a helpful neighbour. Error = what happened + what to do. Empty = friendly + one action. Never blame the user. Short sentences.

## 4. Glossary (EN | HI)
Shop दुकान · Service provider सेवा प्रदाता · Order ऑर्डर · Cart कार्ट · Delivery डिलीवरी · Self-pickup सेल्फ-पिकअप · Offer ऑफ़र · Follow फ़ॉलो · Saved सहेजा · Reviews समीक्षाएँ · Enquiry पूछताछ · Category श्रेणी · Subcategory उप-श्रेणी · Refund रिफ़ंड · Pickup code पिकअप कोड · Verified वेरिफ़ाइड · Open now अभी खुला · Nearby आसपास · Filters फ़िल्टर · Apply लागू करें · Reset रीसेट · Clear all सब हटाएँ · Select all सभी चुनें · Add to cart कार्ट में डालें · Buy now अभी खरीदें · Send enquiry पूछताछ भेजें · Log in लॉग इन · Language भाषा.

## 5. Microcopy
| Situation | English | Hindi |
|---|---|---|
| Empty | Nothing here yet. Add your first item. | यहाँ अभी कुछ नहीं है। पहला आइटम जोड़ें। |
| Payment failed | Payment failed. Your money is safe. Try again or pay on delivery. | पेमेंट नहीं हुआ। आपका पैसा सुरक्षित है। फिर कोशिश करें या डिलीवरी पर दें। |
| Order placed | Order placed! The shop has been notified. | ऑर्डर हो गया! दुकान को खबर कर दी गई है। |
| Location | Allow location to see shops near you. You can browse without it. | पास की दुकानें देखने के लिए लोकेशन दें। बिना लोकेशन भी देख सकते हैं। |
| Confirm cancel | Cancel this order? | यह ऑर्डर रद्द करें? |
| Cancellation notice | Admin and vendor have been notified and will contact you to resolve it. | एडमिन और दुकानदार को सूचना दे दी गई है। वे समाधान के लिए आपसे संपर्क करेंगे। |
| Outside area | We are not in your city yet | हम अभी आपके शहर में नहीं हैं |
| Not eligible to review | Only verified purchasers or enquirers can review. | केवल खरीदार या पूछताछ करने वाले ही समीक्षा दे सकते हैं। |
| No permission | You don't have permission to view this section. | इस सेक्शन को देखने की अनुमति आपके पास नहीं है। |
| Split order | Your order will be split into {n} shops. | आपका ऑर्डर {n} दुकानों में बँटेगा। |
| Services empty | This business has not added any services yet | इस बिज़नेस ने अभी कोई सेवा नहीं जोड़ी है |
| Reels empty Following | Follow shops to see their videos here | यहाँ वीडियो देखने के लिए दुकानों को फ़ॉलो करें |
| Offer expired | This offer ended on {date}. The regular price applies. | यह ऑफ़र {date} को समाप्त हो गया। सामान्य कीमत लागू है। |
| Service enquiry success | Enquiry sent. The provider will contact you. | पूछताछ भेज दी गई। सेवा प्रदाता आपसे संपर्क करेगा। |
| Unfollow confirm | Unfollow {name}? You will stop seeing their videos in Following. | {name} को अनफ़ॉलो करें? Following में उनके वीडियो नहीं दिखेंगे। |
| Media consent | Also show this in my business Gallery / Videos & Reels | इसे मेरे बिज़नेस गैलरी / वीडियो और रील्स में भी दिखाएँ |
## 6. Notification templates (EN / HI; WhatsApp text; email subject)
| Event | In-app EN | In-app HI | WhatsApp | Email subject |
|---|---|---|---|---|
| Order placed | Order {id} placed. | ऑर्डर {id} हो गया। | Hi {name}, your order {id} from {shop} is placed. Total {amt}. | Order {id} confirmed |
| Out for delivery | Rider {rider} is on the way. OTP {otp}. | राइडर {rider} रास्ते में है। OTP {otp}। | Your order {id} is out for delivery. Share OTP {otp} at the door. | Your order is on the way |
| Delivered | Delivered! Rate your order. | डिलीवर हो गया! रेटिंग दें। | Order {id} delivered. Tell us how it went: {link} | Rate order {id} |
| Cancelled / refund | Order cancelled. Admin and vendor have been notified. | ऑर्डर रद्द। एडमिन और दुकान को सूचना दी गई। | Your order {id} is cancelled. We will contact you about the refund. | Order {id} cancelled |
| Approval decision | Your business was approved. | आपका बिज़नेस स्वीकृत हुआ। | {shop}, you are now live on ApnaTown. | You are approved |
| New enquiry | New enquiry from {name}. | {name} की नई पूछताछ। | New enquiry on ApnaTown: {msg} | New enquiry |
Also template (EN+HI): subcategory approved/rejected/merged, video approved/rejected/removed, offer approved/rejected, rider assigned, refund approved, follower announcement, review reply. Admin campaign templates: Offer, New product, Festival greeting, Delay apology (variables `{shop} {offer} {link}`); every marketing message ends "Reply STOP to opt out"; WhatsApp templates need prior approval.
