# BE: communications

Features: F-AD-012 | Rules: BR-11, BR-12, BR-14, BR-02 | State machines: ST-campaign | Depends on: users (consents), geo (cities/zones), businesses/orders/services/engagement (audience read ports), notifications (`notify` + channels), audit, admin (scope/permission guards).

Frontend counterpart: [FE communications](../fe/communications.md)

## Responsibility

Let scoped admins send consent-aware campaigns to "customers of" a shop, a service provider or a single customer, over in-app, WhatsApp and email, with preview, schedule, mandatory review-before-send and a delivery report including opt-outs. Delivery goes through Notifications channels.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `campaigns` | `id uuid PK`; `created_by uuid NOT NULL FK users`; `scope text NOT NULL CHECK ('overall','city','zone')`; `city_ids uuid[] NOT NULL DEFAULT '{}'`; `zone_ids uuid[] NOT NULL DEFAULT '{}'`; `target_type text NOT NULL CHECK ('business','customer')`; `target_id uuid NOT NULL`; `template_key text NOT NULL CHECK ('offer','new_product','festival','delay_apology')`; `message_en text NOT NULL CHECK <= 500`; `message_hi text NULL`; `channels text[] NOT NULL CHECK channels <@ '{in_app,whatsapp,email}' AND cardinality >= 1`; `status text NOT NULL CHECK ('scheduled','sending','sent','cancelled')`; `scheduled_at timestamptz NOT NULL`; `sent_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; `created_at/updated_at`; CHECK scope ↔ ids (`overall` → both empty; `city` → city_ids non-empty; `zone` → zone_ids non-empty) | `(status,scheduled_at)` (scheduler); `(created_by,created_at DESC)` (history) |
| `campaign_recipients` | `campaign_id uuid FK`; `user_id uuid FK users`; `channel text`; `status text CHECK ('queued','sent','delivered','failed','opted_out')`; `notification_id uuid NULL`; `updated_at`; PK `(campaign_id,user_id,channel)` | `(campaign_id,status)` (report) |
| `campaign_reports` | `campaign_id uuid PK FK`; `audience_total int`; `eligible_by_channel jsonb` (`{in_app,whatsapp,email}`); `sent/delivered/failed/opted_out int NOT NULL DEFAULT 0`; `updated_at` | PK |

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/admin/communications/scopes` | Admin `comms:view` | → allowed scopes (`overall` super_admin only; `city`/`zone` only with `comms:edit`) + assigned cities/zones | — | Yes | S-ADMN-13 |
| GET | `/admin/communications/targets?q=` | Admin `comms:view` + scope | → grouped matches: Customers (masked phone `+91 •••••12`), Shops, Service providers within scope (max 20) | — | Yes | S-ADMN-13 |
| POST | `/admin/communications/audience-preview` | Admin `comms:view` + scope | `{scope,cityIds,zoneIds,targetType,targetId,channels}` → `{total, eligible:{in_app,whatsapp,email}, excludedNoConsent}` | `COMMS_SCOPE_NOT_ALLOWED` | Yes | AD12 |
| POST | `/admin/communications/message-preview` | Admin `comms:view` | `{templateKey,message,targetId}` → rendered EN/HI text with `{shop}{offer}{link}` filled | `COMMS_TEMPLATE_INVALID` | Yes | AD12 |
| POST | `/admin/communications/campaigns` | Admin `comms:edit` + scope; audited | `{…preview fields, templateKey, messageEn, messageHi?, scheduledAt?, confirmedSummaryHash}` → campaign | `COMMS_SCOPE_NOT_ALLOWED`, `COMMS_SUMMARY_STALE`, `COMMS_NO_RECIPIENTS` | Required key | AD12 |
| GET | `/admin/communications/campaigns?cursor=` · `/{id}` | Admin `comms:view`; own scope campaigns (super_admin all) | → history with report counts | — | Yes | AD12 |
| POST | `/admin/communications/campaigns/{id}/cancel` | Admin `comms:edit`; status `scheduled` | → cancelled | `COMMS_INVALID_TRANSITION` | Yes | AD12 |

## Rules and use-cases

1. **Scope (08 §5):** `overall` only for super_admin; `city`/`zone` only within the admin's assigned cities/zones and only with `comms:edit`. Validated on preview and on create (server never trusts the UI lock).
2. **Audience:** "customers of" a business = customers with an order or enquiry with it, or who follow it (assumption), whose default address or last order city/zone is in the chosen scope; `customer` target = that single user if in scope. Excludes deleted/suspended users.
3. **Consent-aware counts (BR-11):** per channel, count only recipients with current recorded marketing consent for that channel (in-app counts all eligible users with in-app enabled). The admin sees total, per-channel eligible and excluded; never a raw send count.
4. **Review-before-send:** create requires `confirmedSummaryHash` = hash of the audience-preview result + message + channels; if the recomputed hash differs → `COMMS_SUMMARY_STALE` (re-review).
5. **WhatsApp** uses only the provider-approved template for `template_key` with variables; free text applies to in-app/email only. Requires the `whatsapp` feature flag.
6. **ST-campaign:** `scheduled → sending → sent`; `scheduled → cancelled`. Send now = `scheduled_at = now`. Recipients are re-resolved and consent re-checked at send time, so opt-outs apply to the very next send.
7. Audit: create/cancel with actor, scope, counts (no recipient PII).

## Events and jobs

Job `communications.dispatch` (every minute: claim due `scheduled` campaigns with `FOR UPDATE SKIP LOCKED`, resolve recipients in batches of 500, call Notifications `notify` with `source_event_id = campaign_id`). Consumes `notification.delivery_updated` to update recipient status and report counters; `consent.withdrawn` marks pending recipients `opted_out`.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `COMMS_SCOPE_NOT_ALLOWED` | 403 | `errors.comms.scopeNotAllowed` |
| `COMMS_TEMPLATE_INVALID` | 422 | `errors.comms.templateInvalid` |
| `COMMS_SUMMARY_STALE` | 409 | `errors.comms.summaryStale` |
| `COMMS_NO_RECIPIENTS` | 422 | `errors.comms.noRecipients` |
| `COMMS_INVALID_TRANSITION` | 409 | `errors.comms.invalidTransition` |

## Acceptance criteria

1. Given an area admin, when requesting `scope=overall`, then `COMMS_SCOPE_NOT_ALLOWED`.
2. Given an admin selects a zone outside assigned cities, then 403 on preview and create.
3. Given 100 customers of a shop of whom 62 opted in to WhatsApp, then the preview shows total 100, WhatsApp 62, excluded 38.
4. Given the audience changed after review, when create is called with the old hash, then `COMMS_SUMMARY_STALE`.
5. Given a customer opts out after scheduling, when the campaign sends, then they are recorded `opted_out` and not messaged.
6. Given the dispatcher runs on two instances, then each campaign is sent once.
7. Given an admin with `comms:view` only, when creating, then 403.

## Tests

Unit: scope rules per role, consent filtering, summary hash, ST-campaign. Integration: schedule → dispatch → notifications fake → report; double dispatcher; opt-out between schedule and send. Authorisation negatives: overall by admin, out-of-scope city/zone, missing `comms:edit`.

## Open questions

Q-04 WhatsApp template approval; definition of "customers of" a business (assumed order/enquiry/follow).
