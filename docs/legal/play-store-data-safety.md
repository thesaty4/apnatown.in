# Google Play submission: privacy and data compliance sheet

- **Purpose:** Answers for the Play Console *App content* forms (Privacy policy, Data safety, Account deletion, Permissions, Target audience, Ads) and the pre-submission checklist that keeps them true.
- **Audience:** Release owner, Super Admin, developers
- **Related:** [privacy-policy.md](./privacy-policy.md) (English), [privacy-policy.hi.md](./privacy-policy.hi.md) (Hindi), [open issues](../design-context/11-open-issues-and-assumptions.md) Q-05, Q-12, Q-13, Q-32, Q-51
- **Last updated:** 2026-11-13

> This is a compliance draft prepared from the codebase, not legal advice.
> Have it reviewed by a qualified Indian lawyer before publishing.

## Contents

1. [Publishing the policy](#1-publishing-the-policy)
2. [Play Console: App content answers](#2-play-console-app-content-answers)
3. [Data safety form](#3-data-safety-form)
4. [Permissions and prominent disclosure](#4-permissions-and-prominent-disclosure)
5. [Account deletion](#5-account-deletion)
6. [Gaps to close before submission](#6-gaps-to-close-before-submission)
7. [Keeping the policy accurate](#7-keeping-the-policy-accurate)

## 1. Publishing the policy

| Item | Value |
|---|---|
| Privacy policy URL (Play Console) | `https://apnatown.in/privacy` |
| Hindi URL | `https://apnatown.in/hi/privacy` |
| Source text | `privacy-policy.md` (EN) and `privacy-policy.hi.md` (HI); both use only the Markdown subset rendered by `apps/web/src/features/support/LegalPage.tsx` (headings, lists, `**bold**`, https links; no tables) |
| Page title | EN "Privacy Policy" / HI "गोपनीयता नीति" |
| Effective date / version | 15 November 2026 / 1.0 |

Play requirements for the URL: it must be public (no login), active, not a PDF or editable doc, not geo-blocked, and it must name the entity in the Play listing (**ApnaTown Technologies Pvt. Ltd**). Link the same policy inside the app (footer/Account already links `/privacy`).

**Length blocker:** `LegalBodySchema` (`packages/shared/src/settings.ts`) caps each body at 12,000 characters, but each policy is about 23,000. The full text cannot be saved through Super Admin → Legal pages until the cap is raised or the page is published another way. Do not publish a truncated policy: Play rejects policies that omit collected data types.

## 2. Play Console: App content answers

| Form | Answer |
|---|---|
| Ads | **No**, the app does not contain ads |
| Target audience | **18 and over** only. Do not select any under-18 age group (keeps the app out of the Families policy) |
| App access | **All or some functionality is restricted**. Provide reviewer instructions and a working test login (see gap G-01) |
| Content rating | Complete the IARC questionnaire; user-generated content (reviews, comments, video links) = **Yes**, with moderation and reporting |
| News app / COVID / Health / Government | No |
| Financial features | None of the regulated features (no loans, crypto, banking). Payments are via Razorpay checkout |
| Data safety | See section 3 |
| Account deletion | See section 5 |

## 3. Data safety form

### 3.1 Overview questions

| Question | Answer | Basis |
|---|---|---|
| Does your app collect or share any required user data types? | **Yes** | Section 3.2 |
| Is all user data encrypted in transit? | **Yes** | HTTPS only; secure cookies |
| Do you provide a way for users to request that their data is deleted? | **Yes** | In-app/web Account → Delete account, plus email |
| Independent security review | Optional; leave unchecked unless an MASA audit is done |

"Shared" in Google's definition excludes transfers to service providers acting on your behalf (Razorpay, MSG91, Cloudinary, hosting) and transfers the **user initiates** (order details sent to the chosen shop/rider, enquiries sent to a provider). On that basis, no data type is "shared". If counsel prefers the conservative reading, mark *Name, Phone number, Address, Precise location* as **Shared → App functionality** as well.

### 3.2 Data types

Legend: **C** = collected; **Req/Opt** = required or optional for the user; purposes use Google's names (AF = App functionality, AM = Account management, FP = Fraud prevention, security & compliance, DC = Developer communications, AN = Analytics).

| Google category → type | C? | Req/Opt | Ephemeral? | Purposes | Source in product |
|---|---|---|---|---|---|
| Location → Approximate location | Yes | Opt | No | AF | Selected city/area, address PIN code |
| Location → Precise location | Yes | Opt (customers); Req for riders while Online | No | AF, FP | "Use my location", address pin, business map pin, rider live location (`rider_profiles.last_location`) |
| Personal info → Name | Yes | Opt (Req for riders, enquiries) | No | AF, AM | `users.display_name`, rider `full_name`, enquiry `name` |
| Personal info → Email address | Yes | Opt | No | AM, DC | `users.email_ciphertext`, business email |
| Personal info → User IDs | Yes | Req | No | AF, AM, FP | Internal account ID |
| Personal info → Address | Yes | Opt (Req to get delivery) | No | AF | `addresses`, business address |
| Personal info → Phone number | Yes | Req | No | AF, AM, FP, DC | OTP login, enquiries, business phone/WhatsApp, waitlist |
| Personal info → Other info | Yes | Req for riders | No | AF, FP | Vehicle type/number, GST/billing details |
| Financial info → User payment info | Yes | Req for riders | No | AF | Rider UPI/bank payout (encrypted). Customer card/UPI data goes only to Razorpay; we store only references |
| Financial info → Purchase history | Yes | Req | No | AF, FP | Orders, payments, refunds, subscriptions |
| Messages → Other in-app messages | Yes | Opt | No | AF | Enquiry messages, support messages, comments |
| Photos and videos → Photos | Yes | Opt (Req for rider selfie) | No | AF, FP | Product/gallery/logo/cover images, rider selfie |
| Photos and videos → Videos | **No** | n/a | n/a | n/a | Link-only YouTube/Instagram; no uploads |
| Files and docs | Yes | Opt (businesses), Req (riders) | No | AF, FP | KYC: licence, ID proof, RC, owner ID, registration doc |
| App activity → App interactions | Yes | Opt | No | AF, AN | Likes, hearts, follows, bookmarks, aggregate view counts |
| App activity → In-app search history | **No** | n/a | n/a | n/a | Recent searches stay on device (Q-55) |
| App activity → Other user-generated content | Yes | Opt | No | AF | Reviews, ratings, replies, reports, video links |
| App info and performance → Diagnostics | Yes | Req | No | FP | Server request/error logs (no crash SDK). Change if a crash SDK is added |
| Device or other IDs | **No** | n/a | n/a | n/a | No advertising ID or device fingerprint |
| Health, Fitness, Contacts, Calendar, Audio, Web browsing, SMS/Call logs | **No** | n/a | n/a | n/a | Not accessed |

## 4. Permissions and prominent disclosure

| Permission | Who | When requested | Required disclosure |
|---|---|---|---|
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` (foreground) | All | Only on a location action | In-context explanation before the OS prompt; manual area/address fallback always works (BR: location never mandatory) |
| Location while rider is Online | Riders | When switching Online | Show a prominent in-app disclosure **before** the OS prompt, e.g. "ApnaTown collects your location while you are Online to offer nearby delivery jobs and show live tracking to the customer and shop. Location is not collected when you are Offline." with Accept/Decline |
| `ACCESS_BACKGROUND_LOCATION` | Nobody | **Do not request** | Requesting it triggers the Play background-location declaration and video review. The web/TWA app tracks only while in use |
| Camera / photo picker | Uploaders | On upload | Use the Android photo picker or file input; do not request `READ_MEDIA_IMAGES` broad access |
| `POST_NOTIFICATIONS` | All | After a relevant action | Optional |
| Contacts, SMS, call log, microphone | Nobody | Never | Voice search stays disabled (Q-59). Do not add SMS auto-read permissions; use the SMS Retriever / WebOTP API if OTP auto-fill is needed |

## 5. Account deletion

Play requires both an in-app path and a **web link** that works without reinstalling the app.

| Item | Value |
|---|---|
| In-app path | Account → Delete account |
| Delete-account URL (Play Console) | `https://apnatown.in/privacy` (section 13 explains the steps: sign in at `/account` or email). A dedicated public page such as `https://apnatown.in/delete-account` with the same steps is recommended, because reviewers expect deletion steps to be visible without signing in |
| Email fallback | contact.apnatown@gmail.com, subject "Delete my account" |
| Partial deletion | Supported (addresses, consents, reviews individually) |
| Data deleted / retained | As listed in policy sections 11 and 13 |

## 6. Gaps to close before submission

The policy describes the intended practice. These items are **not yet true in the code** or are undecided, and must be resolved (or the policy text changed) before publishing. A policy that does not match the app's behaviour is a Play policy violation and a DPDP violation.

| ID | Gap | Policy section | Repo reference |
|---|---|---|---|
| G-01 | Play reviewers need a working login. OTP-only login has no reviewer path, and the demo code `123456` is forbidden. Provide a reviewer-only test number with a controlled OTP, or share a live OTP on request through Play's instructions field | App access | `specs/businesses/fe/businesses.md` (no demo OTP) |
| G-02 | Export/delete requests are recorded but processing returns *blocked* until a retention policy is approved | 11, 12, 13 | Q-32; `specs/payments/be/payments.md`, `specs/reviews/be/reviews.md` |
| G-03 | Retention periods (30 days, 8 years, 3 years, 1 year, 2 years, 7 years) are proposed in the policy but not approved or implemented as purge jobs | 11 | Q-05, Q-13, Q-51 |
| G-04 | No age confirmation (18+) at sign-up or in rider/business onboarding | 16 | Not in the feature inventory |
| G-05 | Legal copy owner sign-off | All | Q-12 |
| G-06 | Masked calling, the email provider and WhatsApp sender are not finalised. Remove any line from section 8.2 for a provider that is not in use at launch, and add any new one | 8.2, 9 | Q-04, Q-15 |
| G-07 | WhatsApp "reply STOP" opt-out must work if the policy promises it, otherwise remove the sentence | 9 | Q-04 |
| G-08 | Grievance timelines (acknowledge in 24 h, resolve in 15 days) need an owner and a process | 17 | n/a |
| G-09 | Use a company-domain email (e.g. privacy@apnatown.in) instead of Gmail before launch; reviewers and users trust it more. Update both policy files | 1, 12, 13, 17 | n/a |
| G-10 | MSG91 OTP SMS requires TRAI DLT registration of the entity, header and templates | 8.2 | Q-15 |
| G-11 | Body length exceeds the 12,000-character legal editor cap | 1 of this sheet | `packages/shared/src/settings.ts` |

## 7. Keeping the policy accurate

Update both policy files, bump the version and effective date, and re-submit the Data safety form when any of these change:

- A new data field, document type, consent purpose or notification channel is added
- A new third-party SDK or provider is added (analytics, crash reporting, maps, payments, messaging)
- Background location, contacts, SMS or microphone access is introduced
- Hosting moves outside India, or retention periods change
- Login methods change (email/Google login are gated by Q-30)
