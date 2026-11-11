# BE: communications

Features: F-AD-012 | Rules: BR-11, BR-12, BR-14, BR-02 | State machines: ST-campaign | Depends on: users (consents), geo (cities/zones), businesses/orders/services/engagement (audience read ports), notifications (`notify` + channels), audit, admin (scope/permission guards).

Frontend counterpart: [FE communications](../fe/communications.md)

Contents: [Tables](#tables) · [Endpoints](#endpoints) · [Scope and audience](#scope-audience-and-owning-ports) · [Review token](#preview-issued-review-token) · [Dispatch](#dispatch-receipts-and-report-counters) · [Acceptance](#acceptance-criteria)

## Responsibility

Let scoped admins send consent-aware campaigns to "customers of" a shop, a service provider or a single customer, over in-app, WhatsApp and email, with preview, schedule, mandatory review-before-send and a delivery report including opt-outs. Delivery goes through Notifications channels.

## Tables

| Table | Columns and constraints | Indexes (query served) |
|---|---|---|
| `campaign_audience_snapshots` | `id uuid PK`; `definition_version text NOT NULL`; `revision text NOT NULL`; `scope_revision text NOT NULL`; `as_of timestamptz NOT NULL`; `total int NOT NULL`; `eligible_by_channel/excluded_by_reason jsonb NOT NULL` | PK; revision covers membership, not just counts |
| `campaign_audience_members` | `snapshot_id uuid FK campaign_audience_snapshots`; `user_id uuid FK users`; `audience_role text NOT NULL CHECK ('customer')`; `scope jsonb NOT NULL` (validated ScopeRef); `eligible_channels text[] NOT NULL`; `eligibility_revision text NOT NULL`; PK `(snapshot_id,user_id,audience_role)` | PK keyset dispatch; no phone/email/contact exports |
| `campaign_reviews` | `id uuid PK`; `token_hash bytea NOT NULL UNIQUE`; `actor_user_id uuid NOT NULL FK users`; `normalized_draft jsonb NOT NULL` (schema below); `audience_snapshot_id uuid NOT NULL FK campaign_audience_snapshots`; `scope_revision/template_revision text NOT NULL`; `created_at/expires_at timestamptz NOT NULL`; `consumed_campaign_id uuid NULL UNIQUE` | token hash, `(expires_at)`; reviewed content immutable |
| `campaigns` | `id uuid PK`; `created_by uuid NOT NULL FK users`; `review_id uuid NOT NULL UNIQUE FK campaign_reviews`; `status text NOT NULL CHECK ('scheduled','sending','sent','cancelled')`; `scheduled_at timestamptz NOT NULL`; `sent_at timestamptz NULL`; `dispatch_cursor text NULL`; `lease_until timestamptz NULL`; `version int NOT NULL DEFAULT 1`; timestamps | `(status,scheduled_at,lease_until)` due/resume; `(created_by,created_at DESC,id DESC)` history |
| `campaign_recipients` | `campaign_id uuid FK`; `user_id uuid FK users`; `audience_role text NOT NULL`; `channel text NOT NULL`; `recipient_key text NOT NULL UNIQUE`; `status text CHECK ('queued','sent','delivered','failed','opted_out','suppressed')`; `suppression_reason text NULL`; `notification_id/delivery_id uuid NULL`; `delivery_version int NOT NULL DEFAULT 0`; `sent_at/delivered_at/failed_at timestamptz NULL`; `updated_at`; PK `(campaign_id,user_id,audience_role,channel)` | `(campaign_id,status)` reports; unique non-null delivery_id |
| `campaign_reports` | `campaign_id uuid PK FK campaigns`; `sent/delivered/failed/opted_out/suppressed int NOT NULL DEFAULT 0 CHECK >=0`; `by_channel jsonb NOT NULL`; `version int NOT NULL DEFAULT 1`; `updated_at` | PK, transactionally projected from recipient facts |

`CampaignDraft={scope:'overall'|'city'|'zone',cityIds[],zoneIds[],targetType:'business'|'customer',targetId,channels[],templateKey:'offer'|'new_product'|'festival'|'delay_apology',templateVersion,messageEn,messageHi?,variables,schedule:{kind:'now'|'later',atUtc?},audienceDefinitionVersion}`.
`channels` is a nonempty unique subset of in_app/whatsapp/email. EN text trimmed 1–500; optional HI ≤500. Variables are the selected template's allow-listed `{shop,offer,link}` values/references; internal links only, no demo “10% off” substitute. Scope/id shapes are exclusive: overall has no geo IDs, city has cityIds only, zone has zoneIds only.
Persisted `NormalizedCampaign` adds server-derived `{effectiveScope:{platformWide,cityWideIds[],areaIds[],zoneIds[],geoRevision},destination:{path,scope?},renderedByChannel}` to the normalized draft. These values are returned in review and token-bound too; unresolved template variables/destination fail preview rather than guessing an offer or link.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/admin/communications/scopes` | Active admin `comms:view`; super_admin | → `{allowedScopes,canSend,cities[],zones[],scopeRevision}`; intersect **stored per-admin allowlist**, permissions and actual geographic grants | — | Yes | S-ADMN-13 |
| GET | `/admin/communications/targets?q=` | Admin `comms:view` + scope | → grouped matches: Customers (masked phone `+91 •••••12`), Shops, Service providers within scope (max 20) | — | Yes | S-ADMN-13 |
| POST | `/admin/communications/audience-preview` | `comms:view` + permitted stored scope/target/recipient geography | `CampaignDraft` audience/channel fields → `{total,eligible:{in_app,whatsapp,email},excludedByReason,audienceRevision,definitionVersion}`; not send authority | `COMMS_SCOPE_NOT_ALLOWED`, `COMMS_AUDIENCE_POLICY_REQUIRED` | Yes | F-AD-012 |
| POST | `/admin/communications/message-preview` | `comms:view` + scope/target | Full `CampaignDraft` → normalized/rendered EN/HI per selected channel and template revision; same fields as create | `COMMS_TEMPLATE_INVALID` | Yes | F-AD-012 |
| POST | `/admin/communications/review-preview` | **`comms:edit`** + current stored scope/target | Full `CampaignDraft` → `{normalizedDraft,audience,renderedContent,reviewToken,expiresAt}`; persists immutable reviewed snapshot | `COMMS_SCOPE_NOT_ALLOWED`, `COMMS_AUDIENCE_POLICY_REQUIRED`, `COMMS_TEMPLATE_INVALID`, `COMMS_NO_RECIPIENTS` | Preview only | F-AD-012 |
| POST | `/admin/communications/campaigns` | `comms:edit` + current scope; audited | `{draft:CampaignDraft,reviewToken}` → campaign/status/report; consume matching valid token | `COMMS_SCOPE_NOT_ALLOWED`, `COMMS_SUMMARY_STALE`, `COMMS_NO_RECIPIENTS` | Required key; one campaign/token | F-AD-012 |
| GET | `/admin/communications/campaigns?cursor=` · `/{id}` | Admin `comms:view`; own scope campaigns (super_admin all) | → history with report counts | — | Yes | AD12 |
| POST | `/admin/communications/campaigns/{id}/cancel` | `comms:edit` + full campaign scope; status scheduled | `{expectedVersion}` → cancelled; race with claim is atomic | `COMMS_INVALID_TRANSITION` | Required key/version | F-AD-012 |

## Scope, audience and owning ports

1. **Scope:** `overall` only super_admin. Regular admins must have the selected value in `admin_accounts.communication_scopes` **and** comms permission **and** geographic authority. A zone-only account remains zone-only with comms:edit (`js15.js:23`, `js19.js:52`). `comms:view` supports authorized history/preview, not token issuance/send.
2. Use [Admin scope predicate](../../admin/be/admin.md#scope-and-read-context): selected city/zone filters always intersect actual area/explicit-city grants. Neither a city option nor a zone's parent city broadens an area grant. Target, every recipient and campaign detail/report must remain within that intersection. `canSend=false` when no allowed scope/permission exists.
3. **COMMS-Q1:** “customers of” order/enquiry/follow inclusion, qualifying states and customer geographic membership are not decided. Do not retain the old invented union/default-address-or-last-order rule. Resolve only through an approved `audienceDefinitionVersion`; unknown definition/geography returns `COMMS_AUDIENCE_POLICY_REQUIRED`, not guessed counts. Single-customer overall targeting is allowed only if its active customer identity/consent is known.
4. `CampaignAudiencePort.resolve({ctx,targetType,targetId,scope,cityIds,zoneIds,definitionVersion,asOf,cursor?,limit<=500}) -> {items:[{userId,audienceRole:'customer',scope}],revision,definitionVersion,nextCursor}` is Communications' purpose-specific orchestrator, not a generic segmentation product.
5. Required facts from owners: `OrderAudienceReadPort.customersOfBusiness({businessId,asOf,cursor,limit}) -> Page<{userId,orderId,status,createdAt}>`; `EnquiryAudienceReadPort.customersOfBusiness({businessId,asOf,cursor,limit}) -> Page<{userId,enquiryId,status,createdAt}>` (authenticated links only); Engagement's existing `following/followers` read ports. Query only the sources selected by the approved definition; never match guest phone/name.
6. `CampaignRecipientReadPort.read({userIds[]}) -> [{userId,accountStatus,roles,scope,scopeRevision}]` is required from Users, batch ≤500 and no contact data. Geo's `GeoAdminReadPort.options/resolveZoneScope` supplies authoritative zone relationships; `unresolved` cannot fall back to whole-city scope. Target business identity/scope uses Businesses' typed context.
7. Counts use Notifications' **same** `NotificationEligibilityPort.check` with intent=marketing and each selected channel; current preference, consent, template/channel flags, live user role/status and admin authority all apply. `eligible` is per-channel deliveries; total unique users is separate, not summed across channels.
8. Snapshot members contain only IDs/role/scope/channel eligibility and revision. Reviewed scheduled campaigns may lose recipients through opt-out/scope/target changes, but never silently add new recipients. New membership or expanded scope requires another review/new campaign.
9. All admin campaigns, including Delay apology, use recorded marketing consent; a template label is not an opt-out bypass. WhatsApp is provider-approved template+variables only; free-text previews cannot be substituted into its send.

## Preview-issued review token

1. Review-preview normalizes IDs/enums, sorts/deduplicates geo IDs/channels, normalizes text to Unicode NFC/LF and trims outer whitespace, uses explicit null for absent optional values, and converts Later schedule to a precise UTC instant from IST. Render **these exact normalized values** in the review summary.
2. Store the complete NormalizedCampaign: target, requested/**effective** scope and grants/Geo revision, selected channels, template/version/variables, EN/HI channel renderings/destination, schedule mode/instant, audience definition and membership/eligibility revision. Revision includes **sorted member IDs/roles/scopes/eligible channels**, not just identical recipient counts.
3. Issue a cryptographically opaque token, store only its hash, bind to reviewing admin and immutable review row, expiry **10 minutes** (technical confirmation lifetime). Token is returned only by `/review-preview`; audience/message previews cannot authorize creation.
4. Create accepts only CampaignDraft input fields, reauthorizes actor/scope and **recomputes/compares the full NormalizedCampaign**, including effective scope, renderings and destination. Revalidate template/current audience revision, expiry and unconsumed token in one transaction. Any mismatch → `COMMS_SUMMARY_STALE` and no campaign; actor swap/foreign scope cannot use another admin's token.
5. One token creates one campaign; concurrent/replayed confirmation with the same idempotency key returns it, a changed payload conflicts. Atomically link consumed token, immutable content/audience snapshot, campaign, audit and dispatch outbox. Never accept a client-computed `confirmedSummaryHash`.
6. Now binds `schedule.kind=now` (no caller timestamp), and due time becomes confirmation time; Later binds the exact UTC instant and must still be future on confirmation. Changing Now↔Later, a time, target, geographic ID, variable or locale text requires re-review even with unchanged counts.

## Dispatch, receipts and report counters

- ST-campaign: scheduled→sending→sent; scheduled→cancelled only. `sent` means dispatch handoff completed, not proof every channel delivered; the report supplies actual outcomes. Content/membership are immutable after confirmation.
- `communications.dispatch` claims due scheduled **or expired-lease sending** work with row lock/SKIP LOCKED. Process snapshot members in deterministic PK batches ≤500; create unique recipient intent rows before handoff and advance the dispatch cursor/checkpoint **only after** durable Notification acknowledgement. Worker death repeats unfinished rows with the same keys, never strands sending or skips half a batch.
- Maintenance defers new marketing dispatch without advancing the checkpoint or converting it into opt-out/failure; already handed-off queued attempts are also deferred by Notifications. Recovery resumes the same reviewed snapshot/keys with current authorization, not a refreshed unreviewed audience.
- Call exact [Notifications NotifyCommand](../../notifications/be/notifications.md#typed-notification-command): `{sourceEventId:campaignId,sourceType:'campaign',sourceVersion,recipients:[{userId,audienceRole:'customer'}],category:'offer',topic:'offers',intent:'marketing',channels:reviewedEligibleChannels,content:{kind:'campaign',campaignId,contentVersion:reviewId,templateKey,templateVersion},destination,campaign:{campaignId,contentVersion:reviewId}}`. `reviewedEligibleChannels` is selected channels intersected with this snapshot member's original eligibility, not a live-filtered list that drops opt-outs without receipts. Stable per-user/role/channel keys allow whole-batch retry.
- Original exclusions remain snapshot counts. Every originally eligible recipient/channel gets a recipient row, even if newly disallowed: Notifications records suppression rather than making an adapter call or adding fallback channels. **WhatsApp-only remains WhatsApp-only**. Final current consent/preferences/flags/account/template checks apply on every send **and retry**.
- Owned `CampaignSendReadPort.authorize({campaignId,userId,audienceRole,channel}) -> {eligible,reason?,contentVersion,scope}` lets Notifications recheck campaign state, immutable membership/channel, current creating-admin comms permission/allowlist/geography and recipient geography. Revoked authority suppresses remaining work; never send as a super-admin system job to bypass the original actor.
- Owned `CampaignContentReadPort.read({campaignId,contentVersion}) -> {templateKey,templateVersion,messageEn,messageHi?,variables,renderedByChannel,destination}` returns immutable reviewed content only; a different contentVersion is rejected.
- Consume exact `notification.delivery_updated` payload from Notifications. Shared inbox dedupes eventId; per recipient apply only newer `delivery_version`. Correlation must match campaign/user/role/channel/delivery ID; never increment blindly per callback. If a receipt arrives before the handoff's delivery-ID binding commits, retain/retry it against the unique recipient key, never drop or count it as a new recipient.
- Counter semantics per channel delivery: `sent=count(sent_at != null)` (includes delivered), `delivered=count(delivered_at != null)`, `failed=count(current terminal failed)`, `opted_out=count(suppressed for consent_withdrawn/preference_off)`, `suppressed=count(other suppression reasons)`. Updates subtract old contribution/add new contribution in the same transaction; duplicate/out-of-order receipt changes neither counts nor terminal success.
- Report DTO `{campaignId,status,reviewedAudienceTotal,reviewedEligibleByChannel,dispatchComplete,uniqueRecipients,sent,delivered,failed,optedOut,suppressed,byChannel,updatedAt}` preserves reviewed versus actual totals. A provider with no delivered receipt remains sent, never inferred delivered.
- Consume Users' exact `consent.granted/consent.withdrawn {userId?,anonymousSubjectId?,purpose,channel,consentId,recordedAt}` and account status/deleted events to invalidate eligibility. Notifications owns effective suppression events/counter effects; grants never expand this campaign's snapshot. Event delivery latency never replaces live send-time reads.
- Audit create/cancel/dispatch state changes with actor, full normalized scope, versions and counts (no recipient contacts/message PII in logs). PostgreSQL outbox/jobs only, no new queue infrastructure.

## Error codes added

| Code | HTTP | Message key |
|---|---:|---|
| `COMMS_SCOPE_NOT_ALLOWED` | 403 | `errors.comms.scopeNotAllowed` |
| `COMMS_TEMPLATE_INVALID` | 422 | `errors.comms.templateInvalid` |
| `COMMS_SUMMARY_STALE` | 409 | `errors.comms.summaryStale` |
| `COMMS_NO_RECIPIENTS` | 422 | `errors.comms.noRecipients` |
| `COMMS_INVALID_TRANSITION` | 409 | `errors.comms.invalidTransition` |
| `COMMS_AUDIENCE_POLICY_REQUIRED` | 409 | `errors.comms.audiencePolicyRequired` |

## Acceptance criteria

1. Given an area admin, when requesting `scope=overall`, then `COMMS_SCOPE_NOT_ALLOWED`.
2. Given a zone-only admin with comms:edit, when city/overall or another area's recipients are requested, then preview/token/create reject them without broadening to the parent city.
3. Given an approved audience of 100 with 62 currently WhatsApp-eligible, when previewing, then show 100/62/38 using live preference/consent/flag checks, not a prototype percentage.
4. Given identical counts but changed target/scope/channel/template/text/schedule or member IDs, when confirming the old token, then `COMMS_SUMMARY_STALE`.
5. Given a customer opts out after scheduling, after enqueue or before retry, when an attempt is due, then it is suppressed, no channel is called, and delivery_updated updates optedOut once.
6. Given two dispatchers or a crash halfway through sending, when work resumes, then durable cursor/keys deliver each selected recipient/channel once and complete all remaining batches.
7. Given an admin with `comms:view` only, when creating, then 403.
8. Given an expired/foreign/reused token or a Later time now in the past, when confirmed, then no new campaign is created; a legitimate identical idempotent replay returns the prior campaign.
9. Given a WhatsApp-only campaign, when handed to Notifications, then content/role/campaign keys are complete and no in-app/email fallback is created.
10. Given duplicate/reversed delivered receipts, when reports update, then sent/delivered counts do not double-increment or downgrade; partial failures remain distinct.
11. Given recipient/creating-admin scope is revoked, when dispatching/retrying, then remaining work is suppressed even if the worker has platform credentials.
12. Given an unresolved “customers of” or geographic-membership definition, when preview/token is requested, then a decision gate appears and no guessed audience is sendable.

## Tests

Unit: AC1/2/7/11 allowlist × permission × area/city/global scope, full normalization/token binding and expiry, ST-campaign, counter contributions. Integration: preview→confirm→IST schedule→resumable dispatch→Notification fake→duplicate/out-of-order receipt; withdrawal after enqueue/before retry; two workers/partial-batch crash/cancel race. Negatives: token actor swap, changed same-count audience, malicious text/variables/links, unsupported template, outside-area recipient and unknown membership. No fixture may assume COMMS-Q1's business-customer union.

## Open questions

- **COMMS-Q1 — Open question:** define “customers of” (which order/enquiry/follow states) and recipient city/area/zone membership. Until approved, affected audiences/token/send are blocked, not silently unioned or inferred from last order/default address.
- Q-04 sender/template approval and locale content/variable approval remain external-send gates. No provider is selected here.
- Campaign/audience/content/report retention follows Q-13/Q-32; snapshots are purpose-limited and contain no contact exports. Changing a scheduled audience requires a new review, not an unreviewed expansion.
