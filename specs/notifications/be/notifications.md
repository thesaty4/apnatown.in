# BE: notifications

Features: F-NT-001, F-NT-002, F-X-012 | Rules: BR-02, BR-11, BR-14 | State machines: none | Depends on: users (consents, locale), settings (feature flag `whatsapp`); consumes events from orders, delivery, payments, businesses, catalog, services, offers, media-videos, reviews, engagement, communications.

Frontend counterpart: [FE notifications](../fe/notifications.md)

## Responsibility

Turn domain events into per-user notifications: always in-app, plus email/WhatsApp when the user's preference and recorded consent allow. Own the in-app feed, per-channel preferences, unsubscribe, and EN/HI templates. Channels are adapters behind one `NotificationChannel` port (`in_app`, `email`, `whatsapp`) with fakes for tests.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `notifications` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `audience_role text NOT NULL CHECK (six roles)`; `category text NOT NULL CHECK ('order','offer','review','approval','enquiry','job','admin','system','follow')`; `template_key text NOT NULL`; `params jsonb NOT NULL` (no OTPs/codes/full phones); `link_path text NULL` (internal path only, starts with `/`); `read_at timestamptz NULL`; `source_event_id uuid NOT NULL`; `created_at`; UNIQUE `(user_id,source_event_id,template_key)` | `(user_id,audience_role,created_at DESC,id DESC)` (feed); `(user_id,audience_role) WHERE read_at IS NULL` (badge) |
| `notification_preferences` | `user_id uuid FK users`; `topic text CHECK ('orders','offers','enquiries')`; `channel text CHECK ('email','whatsapp')`; `enabled bool NOT NULL`; `updated_at`; PK `(user_id,topic,channel)` | PK |
| `notification_templates` | `key text`; `channel text CHECK ('in_app','email','whatsapp')`; `locale text CHECK ('en','hi')`; `title text NULL`; `body text NOT NULL`; `provider_template_id text NULL` (WhatsApp approved template); `version int NOT NULL`; `active bool NOT NULL`; PK `(key,channel,locale,version)` | `(key,channel,locale) WHERE active` |
| `notification_deliveries` | `id uuid PK`; `notification_id uuid FK notifications`; `channel text`; `status text CHECK ('queued','sent','failed','skipped_no_consent')`; `attempts int NOT NULL DEFAULT 0`; `provider_message_id text NULL`; `last_error_code text NULL`; `created_at/updated_at` | `(status,updated_at)` (retry/monitoring) |

Template keys (X12; EN+HI each): `order.placed`, `order.out_for_delivery`, `order.delivered`, `order.cancelled`, `refund.requested`, `refund.approved`, `approval.decided`, `enquiry.new`, `subcategory.decided`, `video.decided`, `offer.decided`, `rider.assigned`, `follower.announcement`, `review.received`, `delivery.request` (rider), `admin.alert`. Templates are seeded by migration; edits ship as new versions (no editor UI in the design).

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/notifications?role=&cursor=&limit<=50` | Authenticated; own; `role` must be one the user holds | → rendered (locale) items with category, title, body, link, read flag | `VALIDATION_ERROR` | Yes | F-NT-001, S-CUST-22, S-VEND-17, S-PROV-15 |
| GET | `/notifications/unread-count?role=` + SSE `/notifications/stream` | Own | → `{count}` / push of new items | — | Yes | F-NT-001 (bell badge) |
| POST | `/notifications/{id}/read` · `/notifications/read-all?role=` | Own | → 204 | `NOTIFICATION_NOT_FOUND` | Yes | F-NT-001 |
| GET / PUT | `/notifications/preferences` | Customer; own | `[{topic,channel,enabled}]` → saved; enabling WhatsApp/email for offers also records consent in Users (`PUT /users/me/consents/{purpose}`) in the same use-case | `CONSENT_REQUIRED`, `VALIDATION_ERROR` | Yes | F-NT-002, S-CUST-23 |
| GET | `/notifications/unsubscribe?token=` | Public; signed, single-purpose token (HMAC, 90-day expiry) | → disables that topic/channel and records consent withdrawal | `UNSUBSCRIBE_TOKEN_INVALID` | Yes | F-NT-002 |
| Internal | `notify(userIds, templateKey, params, link, sourceEventId)` | Called by event consumers and Communications | → notifications + deliveries queued | — | Yes (unique key) | F-X-012 |

## Rules and use-cases

1. Each consumer maps one domain event to recipients and a template; insert is idempotent on `(user_id,source_event_id,template_key)`.
2. In-app is always created. Email/WhatsApp are queued only if: user preference enabled for the topic **and** a current recorded consent for that channel exists (BR-11) **and** the `whatsapp` feature flag is on for WhatsApp. Otherwise record `skipped_no_consent`. Transactional order messages (placed/out for delivery/delivered/cancelled/refund) use the orders topic.
3. Render in the user's `preferred_locale`; fall back to EN if a HI template is missing and log a warning.
4. Never put OTPs, delivery/pickup codes, full phone numbers or addresses into params/logs (security instructions).
5. Every email/WhatsApp marketing message includes the unsubscribe link/keyword.
6. Follower announcements fan out in batches of 500 via job, honouring bell and consent.

## Events and jobs

Consumes the events listed under Depends on (via outbox inbox with dedupe). Jobs: `notifications.send` (per delivery; retries 5 with exponential backoff, then `failed`), `notifications.fanout_followers`, `notifications.cleanup` (delete read in-app items older than 180 days — assumption).

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `NOTIFICATION_NOT_FOUND` | 404 | `errors.notifications.notFound` |
| `CONSENT_REQUIRED` | 422 | `errors.notifications.consentRequired` |
| `UNSUBSCRIBE_TOKEN_INVALID` | 400 | `errors.notifications.unsubscribeTokenInvalid` |

## Acceptance criteria

1. Given `order.placed` is consumed twice, then the customer and vendor each get exactly one in-app notification.
2. Given a customer without WhatsApp consent, when an offer notification is produced, then only in-app is created and the delivery row is `skipped_no_consent`.
3. Given a Hindi user, when the feed loads, then items render with HI templates.
4. Given a user with vendor and customer roles, when `role=vendor`, then only vendor-audience items return.
5. Given a valid unsubscribe token, then the channel is disabled and consent withdrawal is recorded; a tampered token returns 400.
6. Given user A requests user B's notification read, then 404.
7. Given the WhatsApp adapter fails 5 times, then the delivery is `failed` and in-app remains.

## Tests

Unit: recipient mapping per event, consent gate, locale fallback, token signing. Integration: event → notification → channel fake; retry/backoff; SSE badge. Authorisation negatives: foreign notification, role not held. Security: params never contain codes/phones.

## Open questions

Q-04 WhatsApp sender/template approval; email provider; in-app retention period (assumed 180 days).
