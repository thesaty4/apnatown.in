# BE: notifications

Features: F-NT-001, F-NT-002, F-X-012 | Rules: BR-02, BR-11, BR-14 | State machines: none | Depends on: users (consents, locale), settings (feature flag `whatsapp`); consumes events from orders, delivery, payments, businesses, catalog, services, offers, media-videos, reviews, engagement, communications.

Frontend counterpart: [FE notifications](../fe/notifications.md)

Contents: [Tables](#tables) · [Endpoints](#endpoints) · [Command](#typed-notification-command) · [Sources](#event-recipient-template-destination-matrix) · [Consent](#preferences-consent-and-send-time-authorization) · [Delivery](#delivery-receipts-and-resumable-jobs) · [Acceptance](#acceptance-criteria)

## Responsibility

Own per-role feeds, the five actual preference keys, EN/HI templates, selected-channel delivery, unsubscribe/verified STOP, receipts and follower fan-out. A logical message is **not automatically an in-app notification**. Communications owns reviewed campaign content/audiences; this module owns final current-eligibility checks and channel adapters (`in_app`, `email`, `whatsapp`) with fakes.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `notifications` | `id uuid PK`; `user_id uuid NOT NULL FK users`; `audience_role text NOT NULL CHECK (six roles)`; `category text NOT NULL CHECK ('order','offer','review','approval','enquiry','job','admin','system','follow')`; `topic text NOT NULL CHECK ('orders','offers','enquiries','system')`; `intent text NOT NULL CHECK ('transactional','marketing')`; `template_key text NOT NULL`; `template_version int NOT NULL`; `content_version text NOT NULL`; `params jsonb NOT NULL` (no codes/full phones); `content_ref jsonb NULL` (immutable campaign reference); `follower_ref jsonb NULL` (`{businessId,announcementId}` only); `link_path text NULL` (allow-listed internal path); `resource_scope jsonb NULL`; `in_app_published_at/read_at timestamptz NULL`; `source_event_id uuid NOT NULL`; `source_type text NOT NULL`; `source_version bigint NOT NULL`; `created_at`; UNIQUE `(user_id,audience_role,source_event_id,template_key,content_version)` | `(user_id,audience_role,in_app_published_at DESC,id DESC)` feed where published; unread partial index only on published in-app items |
| `notification_preferences` | `user_id uuid PK FK users`; `inapp/email/wa_orders/wa_offers/wa_enq bool NOT NULL`; `version int NOT NULL DEFAULT 1`; `updated_at timestamptz NOT NULL` | PK; no invented topic×email checkbox rows |
| `notification_templates` | `key text`; `channel text CHECK ('in_app','email','whatsapp')`; `locale text CHECK ('en','hi')`; `title text NULL`; `body text NOT NULL`; `provider_template_id text NULL` (WhatsApp approved template); `version int NOT NULL`; `active bool NOT NULL`; PK `(key,channel,locale,version)` | `(key,channel,locale) WHERE active` |
| `notification_deliveries` | `id uuid PK`; `notification_id uuid NOT NULL FK notifications`; `channel text CHECK ('in_app','email','whatsapp')`; `status text NOT NULL CHECK ('queued','sending','sent','delivered','failed','suppressed')`; `suppression_reason text NULL`; `campaign_id uuid NULL`; `recipient_key text NULL`; `attempts int NOT NULL DEFAULT 0`; `provider_message_id text NULL`; `last_error_code text NULL`; `lease_until/next_attempt_at/sent_at/delivered_at/failed_at timestamptz NULL`; `version int NOT NULL DEFAULT 1`; timestamps; UNIQUE `(notification_id,channel)` and `(campaign_id,recipient_key)` when campaign-bound | `(status,next_attempt_at,lease_until)` resumable sends; unique `(channel,provider_message_id)` when non-null |
| `notification_provider_receipts` | `channel text`; `provider_event_id text`; `delivery_id uuid NULL FK notification_deliveries`; `event_kind text CHECK ('sent','delivered','failed','stop')`; `received_at timestamptz`; PK `(channel,provider_event_id)`; validated minimal metadata only, no raw message/phone payload | PK dedup; unmatched delivery receipts held for reconciliation, not blind success |
| `notification_fanouts` | `source_event_id uuid PK`; `announcement_id/business_id uuid NOT NULL`; `started_at timestamptz NOT NULL`; `after_user_id/upper_user_id uuid NULL`; `status text CHECK ('queued','sending','complete')`; `lease_until timestamptz NULL`; `version int NOT NULL DEFAULT 1` | `(status,lease_until)` restart checkpoint |

Template keys are enumerated by the matrix below, seeded in **both EN/HI**, immutable per version; no new template-editor UI. WhatsApp requires an approved provider-template mapping, not a guessed vendor or free-text substitution. User-facing order-template key `order.placed` is **not** a producer event.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/notifications?role=&cursor=&limit<=50` | Active authenticated user; own authorized role; admin alert scope rechecked | → published in-app items only: category/title/body/link/read; private no-store | `VALIDATION_ERROR` | Yes | F-NT-001, S-CUST-22, S-VEND-17, S-PROV-15 |
| GET | `/notifications/unread-count?role=` + SSE `/notifications/stream` | Own | → `{count}` / push of new items | — | Yes | F-NT-001 (bell badge) |
| POST | `/notifications/{id}/read` · `/notifications/read-all?role=` | Own | → 204 | `NOTIFICATION_NOT_FOUND` | Yes | F-NT-001 |
| GET / PUT | `/notifications/preferences` | Authenticated customer; own | GET five keys + version/current consent metadata; PUT `{inapp?,email?,wa_orders?,wa_offers?,wa_enq?,expectedVersion,consentAcknowledgements?}` → saved five keys/version | `CONSENT_REQUIRED`, `NOTIFICATION_VERSION_CONFLICT`, `VALIDATION_ERROR` | Key/version | F-NT-002, S-CUST-23 |
| POST | `/notifications/preferences/unsubscribe-marketing` | Authenticated customer; own + CSRF | `{expectedVersion}` → saved prefs + consent withdrawal metadata; scope below | `NOTIFICATION_VERSION_CONFLICT` | Required key | F-NT-002 |
| GET / POST | `/notifications/unsubscribe?token=` · `/notifications/unsubscribe` | Public signed single-purpose capability, subject/channel/purpose/expiry bound | GET confirmation, **no mutation**; POST `{token}` withdraws only token-authorized marketing grants/preferences; no login/PII response | `UNSUBSCRIBE_TOKEN_INVALID` | Yes | F-NT-002 |
| POST | `/notifications/provider-events/{channel}` | Adapter-verified signature, timestamp/replay and sender-account binding | Normalized delivery receipt or verified inbound STOP; provider-independent contract below | `NOTIFICATION_CALLBACK_INVALID` | Provider event ID | F-X-012, F-NT-002 |
| Internal | `NotificationPort.notify(command:NotifyCommand)` | Trusted domain consumer / Communications; verify referenced recipient roles/scopes/content | → `{deliveries:[{deliveryId,userId,audienceRole,channel,status,recipientKey?}]}` for **selected channels only** | `NOTIFICATION_RECIPIENT_INVALID`, `NOTIFICATION_CONTENT_INVALID` | Stable source + role + content + channel | F-X-012 |

## Typed notification command

`NotifyCommand={sourceEventId,sourceType,sourceVersion,recipients:[{userId,audienceRole}],category,topic,intent,channels:('in_app'|'email'|'whatsapp')[],content,destination:{path,scope?},campaign?:{campaignId,contentVersion},follower?:{businessId,announcementId}}`.
`sourceType` is the exact producer event name, or `campaign` for Communications. The trusted matrix derives category/topic/intent/admin module permission; conflicting caller values are rejected. Persist source/template/content/follower references for retry authorization, not just the rendered body.
`content` is exactly one of `{kind:'template',templateKey,templateVersion,params}` or `{kind:'campaign',campaignId,contentVersion,templateKey,templateVersion}`. Campaign content resolves the immutable **reviewed** EN/HI message/variables/channel renderings in Communications; caller cannot substitute different text. Destination is validated against that source's allowed internal route.
For campaigns, audienceRole is explicit (currently customer) and each channel delivery has `recipientKey = campaignId:userId:audienceRole:channel`; sourceEventId is the stable campaign dispatch identity. Never silently add in-app/email when only WhatsApp was selected; failure fallback may use only another selected, eligible channel.
`NotificationEligibilityPort.check({userId,audienceRole,sourceType,topic,intent,channel,templateKey,templateVersion,scope?,follower?,campaign?}) -> {eligible,reason?,consentId?,preferenceVersion,eligibilityRevision}` is shared by preview/send, with current template and source-derived admin module permission checks. Preview never authorizes a later send. Campaign attempts call Communications' `CampaignSendReadPort.authorize` and `CampaignContentReadPort.read` with immutable contentVersion. `UserIdentityPort.readPrincipal` supplies live account state/roles; applicant feeds require the owning application capability, not a self-claimed privileged role. Forged recipient claims fail; loss of a once-valid role after scheduling produces a suppression receipt.

## Event-recipient-template-destination matrix

All producers use their shared outbox envelope; Commerce's canonical envelope is [Orders' event contract](../../orders/be/orders.md#event-contracts) with **aggregateVersion**, not a renamed `version`. The table lists required references; full producer payloads remain canonical and a consumer maps their revision to internal sourceVersion. Catalog's suggestion revision is payload `version`. No event embeds contact, KYC, code or raw support/report text. `B` = business owner with actual vendor/provider role; `A(module,scope)` = `AdminRecipientsPort.list` active view-authorized, exact-area/explicit-city admins plus super admins. Global/unresolved records never fan out to all area admins.
Channel/topic policy: **O** orders = selected I/E/W, wa_orders; **M** marketing offers = selected I/E/W, wa_offers + marketing consent; **E** enquiries = selected I/E/W, wa_enq; **S** system/approval/review/admin = I/E subject to current preferences. I=in_app, E=email, W=whatsapp. Unsupported WhatsApp purpose/template mappings for S stay suppressed-policy pending NT-Q2, not routed through wa_orders by guess.

| Producer → exact event / required references | Recipients / role | Template key · policy | Internal destination |
|---|---|---|---|
| Orders `order.created` `{orderId,businessId,customerUserId,scope,mode}` + Order context | order customer; B | `order.placed`; `order.received` · O | `/orders/{orderId}`; `/{vendor\|provider}/orders/{orderId}` |
| Orders `order.status_changed` `{orderId,toStatus,mode}`; only out_for_delivery/delivered/picked_up | customer | `order.out_for_delivery`, `order.delivered`, `order.picked_up` · O | `/orders/{orderId}`; no OTP in any template |
| Orders `order.cancelled` `{orderId,caseId?}` + canonical transition references; context resolves cancellation actor | customer; **B and A(orders,order scope) for customer cancellation (BR-20)** | `order.cancelled`; `order.cancellation_requested`; `admin.alert` · O / S for admin | `/orders/{orderId}`; `/{vendor\|provider}/orders/{orderId}`; `/admin/orders/{orderId}` |
| Orders `refund.requested` `{refundRequestId,orderId,caseId,paymentAttemptId,financialVersion}` | customer; **B and A(orders,order scope) (BR-20)** | `refund.requested`; `admin.alert` · O / S for admin | `/orders/{orderId}/refund`; `/{vendor\|provider}/orders/{orderId}`; `/admin/orders/{orderId}` |
| Orders **`refund.approved`**, **`refund.declined`** `{refundRequestId,orderId,caseId,paymentAttemptId,decisionId,decisionVersion}` | order customer | `refund.approved`, `refund.declined` · O | `/orders/{orderId}/refund` |
| Payments **`payment.refund_completed`** `{refundId,refundRequestId,orderId,paymentAttemptId,amountPaise,completedAt}` | customer | `refund.completed` · O | `/orders/{orderId}/refund`; only verified execution completion, not approval/request |
| Orders `order.items_adjusted` `{orderId}` | customer | `order.items_adjusted` · O | `/orders/{orderId}` |
| Orders `order.case_opened` `{caseId,orderId,caseType}`; non-cancel/refund cases only | A(orders,order scope) | `admin.alert` · S | `/admin/orders/{orderId}`; BR-20 cases already handled above |
| Orders `order.case_updated` `{caseId,orderId,caseType,status,caseVersion,actorKind}` | customer only when Orders context confirms a **public status** change | `order.case_updated` · O | `/orders/{orderId}`; never internal notes or a fabricated event field |
| Delivery `delivery.offer_created` `{offerId,jobId,riderUserId,expiresAt}` (required producer handoff) | that approved rider, while offer valid | `delivery.request` · O | `/rider/requests` |
| Delivery `delivery.assigned` `{jobId,orderId,riderUserId}` | customer; assigned rider | `rider.assigned` · O | `/orders/{orderId}`; `/rider/active` |
| Delivery `delivery.failed`, `delivery.unassigned`, `delivery.code_locked` `{jobId?,orderId,kind?}` | A(orders,order scope) | `admin.alert` · S | `/admin/orders/{orderId}`; no raw code |
| Businesses `business.application.submitted` `{businessId}` | A(approvals,business scope) | `admin.alert` · S | `/admin/approvals/{business\|provider}/{businessId}` |
| Businesses **`business.application.decision_changed`** `{businessId,ownerUserId,cityId,areaId,status,previousStatus?,version}` | applicant/owner vendor or provider audience | `approval.decided` · S; reason from the version-bound context port | `/{vendor\|provider}/onboarding`; approved → `/{vendor\|provider}/overview` |
| Delivery `rider.application_submitted` `{riderUserId,applicationVersion,scope}` | A(approvals,rider scope) | `admin.alert` · S | `/admin/approvals/rider/{riderUserId}` |
| Delivery `rider.application_decided` `{riderUserId,applicationVersion,scope,status,reasonKey?,decisionId}` | rider applicant | `approval.decided` · S | `/rider/onboarding`; approved → `/rider/home` |
| Services `service.enquiry.created` `{enquiryId,businessId,serviceId?}` | B | `enquiry.new` · E | `/{vendor\|provider}/enquiries/{enquiryId}` |
| Catalog `catalog.subcategory_suggestion.submitted` `{suggestionId,businessId,submitterUserId,cityId,areaId,status,version,subcategoryId?}` | A(catalog,suggester scope) | `admin.alert` · S | `/admin/subcategory-suggestions?tab=pending&suggestionId={id}` |
| Catalog `catalog.subcategory_suggestion.approved`, `catalog.subcategory_suggestion.rejected`, `catalog.subcategory_suggestion.merged` (same canonical payload above) | original submitter/authorized role | `subcategory.decided` · S | owning product/service-manager return path from suggestionNotice; not guessed from an ID prefix |
| Offers `offer.submitted` `{offerId,businessId}` | A(promos,business scope) | `admin.alert` · S | `/admin/promotions?tab=offers&offerId={id}` |
| Offers `offer.approved`, `offer.rejected` `{offerId,businessId,reasonKey?}` | B | `offer.decided` · S | `/{vendor\|provider}/offers?offerId={id}` |
| Media `video.submitted` `{videoId,businessId}` | A(reviews,business scope) | `admin.alert` · S | `/admin/videos?tab=pending&videoId={id}` |
| Media `video.approved`, `video.rejected`, `video.removed` (moderator-origin only) `{videoId,businessId,reasonKey?}` | B | `video.decided` · S | `/{vendor\|provider}/media?videoId={id}` |
| Media `video.reported`, `photo.reported` `{reportId,businessId,videoId?\|assetId?}` | A(reviews,media scope) | `admin.alert` · S | `/admin/videos?tab=reported&reportId={id}` |
| Reviews `review.published` `{reviewId,firstPublication:true}` | target owner vendor/provider or rider | `review.received` · S | `/{vendor\|provider}/reviews?reviewId={id}` or `/rider/feedback` |
| Reviews `review.reported` `{reviewId}` | A(reviews,target scope) | `admin.alert` · S | `/admin/reviews?tab=reported&reviewId={id}` |
| Reviews **`review.replied`** `{reviewId}` | review author/customer | **`review.replied`** · S | authorized target path + `#review-{id}` |
| Reviews `review.moderation_decided` `{reviewId,action,toStatus}` | author/customer | `review.decided` · S | `/my-reviews?reviewId={id}` |
| Engagement `engagement.comment_pending` / `engagement.comment_moderated` `{commentId,videoId,businessId,authorUserId,scope}` | A(reviews,video scope) / comment author | `admin.alert` / `comment.decided` · S | `/admin/videos?content=comments&tab=pending` / `/videos/{videoId}?commentId={id}` |
| Engagement `engagement.announcement_created` `{announcementId,businessId,kind}` | current eligible bell-on followers/customer | `follower.announcement` · M | explicit validated target path or `/offers` / `/videos` |
| Admin `listing.reported` `{reportId,targetType,targetId,cityId,areaId}` | A(catalog,listing scope) | `admin.alert` · S | `/admin/listings?reportId={id}` |
| Settings **`support.message_submitted`** `{messageId,scope}` | A(users,known scope); global/guest unknown scope → super_admin only | **`support.received`** · S | **`/admin/overview?supportMessageId={id}`** |
| Communications `NotifyCommand` with sourceType=`campaign` (internal handoff, not a new domain event) | reviewed snapshot customers, explicit role/channel keys | `offer`, `new_product`, `festival`, `delay_apology` · M | exact immutable destination in the reviewed campaign; no inferred fallback link |

No subscription to nonexistent `order.placed`, `business.status_changed` or generic `refund.decided`. Unlisted cache/counter events do not generate notices automatically. In particular `review.hidden/deleted/restored` are companions to `review.moderation_decided`, not duplicate author notices.

### Required context read ports (internal, least privilege)

- `OrderNotificationReadPort.context({orderId,caseId?,caseVersion?,refundRequestId?,eventVersion}) -> {customerUserId,ownerUserId,ownerRole,scope,orderNumber,mode,totalPaise,customerPath,refundPath,ownerPath,adminPath,cancellationActorKind?,caseUpdate?:{publicStatusChanged,status}}`. Orders owns authoritative recipients/BR-20 routing and immutable outcome references; internal-note-only updates do not send a customer notice.
- `DeliveryNotificationReadPort.context({orderId?,jobId?,offerId?,riderUserId?,eventVersion}) -> {customerUserId?,riderUserId?,scope,orderId?,offerExpiresAt?,riderFirstName?}`; recheck current offer/assignment before send, never expose code/location/contact.
- `BusinessNotificationReadPort.context({businessId,eventVersion}) -> {ownerUserId,ownerRole,scope,nameEn,nameHi,status,reasonKey?}`; exact event decision is preserved even if later status changes.
- `ServiceNotificationReadPort.context({enquiryId}) -> {businessId,serviceId?,ownerUserId,ownerRole,scope,customerUserId?}`; enquiry text/phone not put on the event bus.
- Use `CatalogReadPort.suggestionNotice({suggestionId,version})` as defined in [Catalog BE](../../catalog/be/catalog.md#events-and-jobs); reason/approved-or-merged target are read there, not invented event payload fields.
- `OfferNotificationReadPort.context({offerId,eventVersion}) -> {businessId,ownerUserId,ownerRole,scope,title,decision,reasonKey?}`.
- Media/Reviews use their declared `MediaNotificationReadPort`/`ReviewNotificationReadPort`; Engagement supplies `FollowerAnnouncementReadPort` and minimal authorized comment context `{authorUserId,videoId,scope}`. Settings supplies `SettingsSupportReadPort.notificationContext({messageId}) -> {scope,linkPath}`.
- Context readers authorize the notification-consumer purpose, expose no arbitrary private object, and verify event/entity/version pairing. Current recipient role/scope eligibility is checked again by NotificationEligibilityPort; multi-role users may receive separate role-bound items without cross-role feed leakage.

## Preferences, consent and send-time authorization

1. Persist exactly **`inapp,email,wa_orders,wa_offers,wa_enq`**, matching final preferences `js7.js:30–32`. Prototype initial values are inapp/email/wa_orders/wa_enq true, wa_offers false; these display defaults **are not recorded consent**, and never authorize WhatsApp/marketing without evidence.
2. `inapp` gates every new in-app publication; `email` gates Email updates; WhatsApp selects wa_orders / wa_offers / wa_enq by topic. Changing inapp off preserves old feed/read state but stops new publication; re-enabling does not replay suppressed history.
3. Before enqueue **and immediately before every actual send/retry/in-app publication**, read current account status/role, scope, preference, `SettingsService.getCurrentFlag`, template availability, campaign authorization, follower bell/membership/target and **`ConsentReadPort.current({userId,purpose,channel})`**. Missing/withdrawn consent is false; a historical grant or preview cannot authorize delivery. During maintenance defer new marketing attempts durably; keep receipts/STOP/withdrawal and permitted in-flight transactional correctness processing admitted.
4. Use the [Users purpose registry](../../users/be/users.md#data-processing-and-read-ports): marketing → `purpose=marketing` for the selected channel; WhatsApp orders → `order_updates`; WhatsApp enquiries → `enquiry_updates`. Campaigns/follower announcements require marketing consent even when their template says “delay apology”. Transactional in-app/email honor their preferences; no invented wa_system preference or borrowing wa_orders for unrelated messages.
5. Preference grants carry `consentAcknowledgements:[{purpose,channel,noticeVersion}]` only for explicit choices whose notice was displayed, then call Users' `ConsentWritePort.record` in the same transaction. Response includes `{consentId,recordedAt}`; a stale/missing required grant notice is `CONSENT_REQUIRED`. Disabling withdraws the corresponding grant, never unrelated purposes, and does not require a current notice acknowledgement. User grants are append-only Users records, not duplicate evidence here.
6. **Marketing-only bulk opt-out:** atomically set `wa_offers=false,email=false` (source), withdraw `marketing` grants for all channels, and preserve `inapp,wa_orders,wa_enq` and transactional WhatsApp consents. No account suspension or “all notifications off”. Email's global checkbox cannot be bypassed for transactional messages; see NT-Q2 rather than inventing per-topic email controls.
7. Signed unsubscribe capability binds user/purpose/channel/action and configurable expiry; POST can only revoke marketing. GET/link scanners never mutate; a tampered/expired token changes nothing. Redact token query/body from access/application logs, use no-referrer/no-store and no third-party page resources. No fixed 90-day legal policy is assumed.
8. **WhatsApp STOP:** adapter verifies provider signature over raw bytes, account/tenant, timestamp and event ID before normalizing sender and STOP. Resolve verified sender via Users `UserIdentityPort.resolveVerifiedPhone`, never accept a body-supplied userId. Atomically set all three WhatsApp preferences false and withdraw marketing/order_updates/enquiry_updates **for WhatsApp only**; retain email/inapp choices. Unknown sender gets generic acknowledgement, no account creation or enumeration; duplicate verified STOP is idempotent.
9. Suppression reasons are explicit: `preference_off,consent_withdrawn,channel_disabled,subject_inactive,scope_revoked,target_unavailable,policy_unresolved`. Record suppression and emit delivery_updated so campaign opt-out/other suppression counts are truthful. A withdrawal committed before the final authorization read prevents send; an already accepted provider request cannot be recalled or relabeled unsent.
10. Render the approved content version in preferred locale; EN fallback only if a localized template is genuinely unavailable, with safe warning (never body/PII). Never include OTP/pickup codes, full phones/addresses, private evidence or raw provider payloads. Marketing includes approved unsubscribe/STOP copy; no external send without Q-04 template/provider configuration.

## Delivery receipts and resumable jobs

- Event consumers use outbox/inbox dedupe; unique logical-message and channel keys also protect crash-before-ack replay. A WhatsApp-only campaign may have a logical row but **no** in_app delivery, feed item, unread badge or SSE feed event.
- `notifications.send` claims queued or expired-lease work durably: queued→sending→sent→delivered, or retries then failed; authorization loss before handoff → suppressed. Adapter request key is `deliveryId`; timeout with uncertain provider acceptance must reconcile before retry, never blindly double-send. Five bounded exponential-backoff attempts; retry checks current eligibility again.
- Verified provider receipts deduplicate `(channel,providerEventId)`, bind the correct delivery/provider account, and transition monotonically by version. Delivered can arrive before sent acknowledgement; set sentAt/deliveredAt once. Duplicate/stale sent/failed callbacks cannot downgrade delivered. “Sent” means provider accepted, not delivered; email providers without delivery evidence cannot manufacture delivered.
- Publish exactly **`notification.delivery_updated {deliveryId,notificationId,sourceEventId,campaignId?,recipientKey?,userId,audienceRole,channel,status,suppressionReason?,sentAt?,deliveredAt?,failedAt?,version,occurredAt}`** with shared eventId on an effective change. Communications deduplicates event ID/version and updates reports transactionally; a callback replay does not add another counter.
- In-app publication is one authorized transaction setting in_app_published_at and channel delivered state; SSE/unread events are deduplicated by notification ID. Reading is separate from delivered.
- `notifications.fanout_followers` uses durable `notification_fanouts` cursor/high-water mark and source identity, batches ≤500, per-recipient command keys. Only follows established by startedAt are considered; current bell/business/account/consent checks can shrink eligibility. Resume expired sending leases from the last committed checkpoint; never abandon or restart at recipient zero. Recheck again at channel attempt, including mid-fan-out withdrawal.
- Consume exact Users events **`consent.granted` / `consent.withdrawn`** with `{userId?,anonymousSubjectId?,purpose,channel,consentId,recordedAt}`. Grants invalidate eligibility only, never resurrect previously suppressed deliveries; withdrawals invalidate/suppress pending matching work. Anonymous consent is not a user-account marketing grant.
- Consume **`user.account.status_changed`** and **`user.account.deleted`** to suppress pending deliveries, invalidate subject/feed caches and stop fan-out; live Users principal read is authoritative even before the event is delivered. Admin grant/scope revocation and channel-flag changes trigger the same recheck.
- Consume `feature_flag.updated {key,enabled,version}` and Admin scope/status events for invalidation; live checks remain authoritative. Maintenance deferral is not a permanent opt-out/failure and cannot be bypassed by an external retry worker.
- No assumed 180-day feed cleanup. Retention/erasure follows approved Q-13/Q-32, not a speculative timer.

## Account data contract

`NotificationsUserDataPort` implements Users' `UserDataPort.exportPage({userId,cursor,limit})`: own five preferences, permitted feed/message metadata and delivery outcomes; exclude provider credentials/IDs, tokens and now-unauthorized admin target content. Internal orchestrator only, stable cursor, limit ≤50.
`erase({userId,requestId,policyVersion}) -> {receipt,status:'completed'|'blocked',reasonCode?}` stops pending sends immediately, then applies only an approved Q-32 retention/anonymization plan. Unknown disposition returns blocked; repeat requests reuse receipts and cannot resend or double-adjust campaign counters. Financial/audit/consent retention remains with its owner; no public export/deletion-completion endpoint is added here.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `NOTIFICATION_NOT_FOUND` | 404 | `errors.notifications.notFound` |
| `CONSENT_REQUIRED` | 422 | `errors.notifications.consentRequired` |
| `UNSUBSCRIBE_TOKEN_INVALID` | 400 | `errors.notifications.unsubscribeTokenInvalid` |
| `NOTIFICATION_VERSION_CONFLICT` | 409 | `errors.notifications.versionConflict` |
| `NOTIFICATION_CALLBACK_INVALID` | 401 | `errors.notifications.callbackInvalid` |
| `NOTIFICATION_RECIPIENT_INVALID` | 403 | `errors.notifications.recipientInvalid` |
| `NOTIFICATION_CONTENT_INVALID` | 422 | `errors.notifications.contentInvalid` |

## Acceptance criteria

1. Given `order.created` is consumed twice with eligible preferences, when handled, then customer and vendor/provider role deliveries occur once; `order.placed` is never treated as the producer event.
2. Given a customer cancellation/refund request, when handled, then both owning business and currently area/module-authorized admins receive their role-bound notice; another area in the same city is excluded.
3. Given each matrix source, when replayed, then its exact recipients/template/destination resolve once, including refund.approved/declined, business decisions, review reply/moderation and support alert.
4. Given consent/preference/WhatsApp flag is withdrawn after enqueue or before a retry, when an adapter attempt is due, then it is suppressed with an event/report update and no external call.
5. Given a WhatsApp-only campaign, when dispatched, then selected content/role/correlation survive the handoff and no in-app item/badge is created.
6. Given inapp off or marketing-only opt-out, when saved/reloaded, then actual keys persist; bulk marketing opt-out leaves wa_orders/wa_enq/inapp unchanged and cannot revoke unrelated transactional consent.
7. Given a forged versus verified duplicate STOP callback, when received, then forged changes nothing and verified STOP withdraws all WhatsApp choices once without touching email/inapp.
8. Given duplicate/out-of-order delivered receipts or a worker crash mid-batch, when resumed, then statuses/counters advance once and sending work is not stranded; provider-unknown outcomes reconcile before retry.
9. Given a multi-role Hindi user or a foreign notification ID, when reading/marking, then the correct role/localized feed is isolated and foreign writes return 404; revoked admin scope exposes no old sensitive alert body.
10. Given a valid signed unsubscribe capability, when GET then POST are performed, then GET changes nothing and POST revokes only authorized marketing; tampered/expired capability is rejected.
11. Given a follower turns off bell/consent mid-fan-out or an account is suspended/deleted, when the next batch/attempt runs, then current eligibility suppresses remaining work regardless of cached historical grants.
12. Given account erasure without approved retention policy, when requested internally, then pending sends stop but destructive processing returns blocked; receipts/exports never disclose another subject.

## Tests

Unit: all matrix rows/recipient-role-topic rules (AC1–3), five-key mutation/consent mapping, signed capability and STOP verification. Integration: fake channels with post-enqueue and pre-retry withdrawal (AC4/11), WhatsApp-only dispatch, callback dedupe/version ordering, uncertain acceptance reconciliation, interrupted fan-out, counter events and account receipts. Negatives: foreign role/ID, same-city foreign admin area, forged sender/body userId, source/content mismatch, malicious text/internal-path injection and unapproved templates. SSE/feed tests assert no unconditional in-app delivery.

## Open questions

- **NT-Q1 — Open question:** Q-04 sender/provider/template approval and supported receipt/idempotency capabilities are not selected; block unsupported external attempts, not the known in-app/feed contracts.
- **NT-Q2 — Open question:** source has one global Email updates switch (bulk marketing opt-out turns it off) and no WhatsApp system/approval/review toggle. Confirm transactional-email expectations and additional-purpose consent mapping; never bypass the existing switch or silently reuse wa_orders. Until resolved, external messages lacking an approved purpose/template are suppressed-policy.
- Consent purpose identifiers above require alignment with Users' allowed-purpose registry; absent an approved purpose, no grant or send is inferred. Q-13/Q-32 govern retention/erasure and unsubscribe capability lifetime.
