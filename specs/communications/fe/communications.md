# FE: communications

Features: F-AD-012 | Screens: S-ADMN-13 | Flows: J10

Backend contract: [BE communications](../be/communications.md)

## Routes and rendering

| Route (production) | Screen ID | Rendering + reason | Auth / role | Index policy |
|---|---|---|---|---|
| `/admin/communications` | S-ADMN-13 | SSR shell (scopes, history) + client composer | Admin `comms:view` (+ `comms:edit` to send); super_admin | noindex |

## Screens

### S-ADMN-13 Communications | `d-admin-acomms.jpg`, `m-admin-acomms.jpg`
- Layout (two columns desktop, stacked mobile), numbered cards:
  1. **Scope** — segmented Overall / City-wise / Zone-wise; disallowed options shown disabled with lock icon + "Super Admin only"; helper "Your admin account can send: …"; city/zone multi-select chips.
  2. **Audience** — `Combobox` "Send to customers of" (groups Customers / Shops / Service providers, recent picks); three count tiles Total audience / WhatsApp opted-in / Excluded (no opt-in); info alert "Only customers who opted in … Opted-out numbers are never messaged."
  3. **Channels** — checkboxes WhatsApp Business, In-app notification, Email with eligible counts.
  4. **Template & message** — chips Offer / New product / Festival greeting / Delay apology; editable message textarea with variables `{shop} {offer} {link}`; note "WhatsApp templates need prior approval from Meta."
  5. **Preview** (phone mock, EN/HI) and **Schedule** (Send now / Later with IST date-time).
  - Button "Review & send" opens `ReviewBeforeSendSummary` (scope, audience, per-channel counts, template, schedule) → Confirm.
  - History list with status chip (Scheduled / Sent / Cancelled) and delivery report (sent, delivered, failed, opted out).
- Data: `/admin/communications/scopes`, `/targets?q=` (debounced 250 ms), `/audience-preview` (on any change), `/message-preview`, `POST /campaigns` with `confirmedSummaryHash`, history endpoints.
- Special states: no permission (standard); scope not allowed (no scope at all → "Your admin account can't send messages at any scope. Ask a Super Admin to enable City-wise or Zone-wise sending."); zero eligible recipients (Review disabled); stale summary (re-open review with refreshed counts).
- Acceptance: Given an area admin, then Overall is disabled with a lock and "Super Admin only". Given no channel selected, then Review & send is disabled. Given the server returns `COMMS_SUMMARY_STALE`, then the summary reopens with new counts. Given `comms:view` only, then the composer is read-only and history is visible. Given Hindi, then all labels and counts render with Hindi text and Indian grouping.

## Feature components

`CampaignComposer`, `ScopePicker`, `AudienceCounts`, `ChannelPicker`, `TemplatePicker`, `MessagePreview`, `CampaignHistory` in `src/features/admin/communications`. Shared: `Combobox`, `ReviewBeforeSendSummary`, `Chip`, `DataTable`, `Toast`.

## i18n and analytics

Prefix `admin.comms.*`. Events: `campaign_reviewed`, `campaign_scheduled`, `campaign_sent`, `campaign_cancelled`.

## Tests

Component: disabled scopes per role, counts update, review gating. E2E: J10 super admin sends city-wise offer; area admin blocked from Overall.
