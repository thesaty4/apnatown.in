# FE: communications

Features: F-AD-012 | Screens: S-ADMN-13 | Flows: J10

Backend contract: [BE communications](../be/communications.md)

API integration: [shared React Query contract](../../_foundation/frontend-shared.md#api-integration-with-react-query).

Contents: [Routes](#routes-and-rendering) · [Screens](#screens) · [Components](#feature-components) · [Verification](#verification)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/admin/communications` | S-ADMN-13 | SSR shell (scopes, history) + client composer | Admin `comms:view` (+ `comms:edit` to send); super_admin | noindex |

## Screens

### S-ADMN-13 Communications | `d-admin-acomms.jpg`, `m-admin-acomms.jpg`
- Layout (two columns desktop, stacked mobile), numbered cards:
  1. **Scope** — Overall / City-wise / Zone-wise; Overall locked “Super Admin only” for regular admins. City/Zone obey the **per-admin stored allowlist**, not just comms:edit; a zone-only account's City option says “Not enabled for this admin”. Helper “Your admin account can send: …”; server-authorized city/zone chips.
  2. **Audience** — `Combobox` "Send to customers of" (groups Customers / Shops / Service providers, recent picks); three count tiles Total audience / WhatsApp opted-in / Excluded (no opt-in); info alert "Only customers who opted in … Opted-out numbers are never messaged."
  3. **Channels** — checkboxes WhatsApp Business, In-app notification, Email with eligible counts.
  4. **Template & message** — Offer / New product / Festival greeting / Delay apology; `messageEn` and optional `messageHi` tabs, allow-listed `{shop} {offer} {link}` variables; approved WhatsApp-template status. Missing variable/template approval is a gate, never demo “10% off” or substituted free text.
  5. **Preview** (phone mock, EN/HI) and **Schedule** (Send now / Later with IST date-time).
  - Review & send calls **POST `/review-preview`** and opens `ReviewBeforeSendSummary` with the returned **normalized** target, requested/effective geographic intersection, channels, template/version/variables, EN/HI channel content/**destination**, audience revision/counts, exact IST schedule and token expiry. Confirm is impossible without its server-issued token.
  - History shows Scheduled / Sending / Sent / Cancelled and actual per-channel sent/delivered/failed/opted-out counts, plus other suppression reasons. “Sent” dispatch state is not a claim that every delivery arrived; reviewed counts and actual outcomes are separate.
- Data: `/admin/communications/scopes`, `/targets?q=` (debounced 250 ms), `/audience-preview`, `/message-preview`, `/review-preview`, POST `/campaigns` **`{draft,reviewToken}`** with one retained idempotency key. No client-computed summary hash.
- Audience/message/review calls share BE `CampaignDraft` field names; Confirm sends that input subset, not server-owned scope/authority fields from NormalizedCampaign. Editing target, area/zone/city, channel, template/version/variables, either message or schedule invalidates the token immediately, even if counts stay equal. Expiry disables Confirm; stale response refreshes previews and requires explicit re-confirmation, never auto-send.
- Store Later as the selected IST date/time converted to server UTC; display the returned instant as IST 12-hour. Do not shift it through the browser's timezone or silently change a past schedule to Now. Now/Later switches also invalidate review.
- Campaign history/detail/cancel use current scope/version. During sending, poll existing detail/report; resume/retries are BE jobs, not a new browser “resend all” action. Cancel is available only for scheduled state; a claim/version race refreshes state.
- Special states: no send scope helper from source; read-only view permission; zero eligible recipients; **audience-definition required (COMMS-Q1)** distinct from zero; unsupported template/channel; token stale/expired; scope revoked while review is open; unknown delivery receipt distinct from delivered.
- Acceptance: Given zone-only comms:edit, when loading composer, then Zone is available but City/Overall cannot be selected or forged. Given no selected channel or unresolved audience definition, when composing, then Review/Confirm stay disabled with a specific explanation.
- Acceptance: Given a valid review token, when any normalized draft field changes while counts remain equal, then Confirm invalidates; expired/stale token triggers re-review without sending.
- Acceptance: Given a Later time crossing an IST date boundary, when reviewed/confirmed, then the server-returned IST schedule is unchanged and a now-past time is rejected.
- Acceptance: Given WhatsApp-only selected, when a campaign dispatches, then report shows only that selected channel and no in-app delivery is promised. Given duplicate/late receipts or an interrupted batch, when history refreshes, then deduplicated counts and resumed progress appear without a browser resend.
- Acceptance: Given comms:view only or permission revoked during review, when Confirm is attempted, then it cannot send; authorized history remains read-only. Given Hindi/dark mode, when all steps/summary render, then labels, content, counts and schedule remain readable.

## Feature components

`CampaignComposer`, `ScopePicker`, `AudienceCounts`, `ChannelPicker`, `TemplatePicker`, `MessagePreview`, `CampaignHistory` in `src/features/admin/communications`. Shared: `Combobox`, `ReviewBeforeSendSummary`, `Chip`, `DataTable`, `Toast`.

## i18n and analytics

Prefix `admin.comms.*`. Events: `campaign_reviewed`, `campaign_scheduled`, `campaign_sent`, `campaign_cancelled`.

## Verification

Follow the [verification policy](../../../AGENTS.md#4-hard-limits-non-negotiable): manual acceptance evidence and existing non-test checks only; do not generate automated test files.

Manual UI/accessibility: stored scope allowlist, searchable combobox/chips with keyboard and focus restoration, EN/HI draft isolation, complete summary/expiry, no-channel/zero/policy-required states, topmost Esc, IST schedule, Hindi/dark. Manual journey J10: preview→token→confirm→report, zone-only versus city-enabled, same-count target/scope edits, expired/cross-admin token, withdrawal after enqueue/before retry, WhatsApp-only campaign, interrupted dispatch and duplicate delivered receipts. Malicious text/variable/link previews stay inert; no action bypasses BE authorization.
