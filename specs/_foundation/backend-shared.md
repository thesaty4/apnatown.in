# Backend shared foundation

## Contents

- [Application structure and dependency rules](#application-structure-and-dependency-rules)
- [Shared layer](#shared-layer)
- [Opaque-token helper](#opaque-token-helper)
- [Error contract](#error-contract)
- [Catalog reference slice](#catalog-reference-slice)

## Application structure and dependency rules

```text
apps/api/src/
  modules/<module>/
    presentation/     # controllers, request/response DTO adapters
    application/      # use-cases, policies, transaction orchestration
    domain/           # entities, value objects, events, repository ports
    infrastructure/   # SQL/ORM repositories, external adapters
  shared/
    config/ logger/ errors/ validation/ auth/ persistence/ events/
    jobs/ idempotency/ rate-limit/ i18n/ openapi/
  integrations/
    payments/ otp/ whatsapp/ email/ storage/ maps/
```

| Layer | May depend on | Must not |
|---|---|---|
| Presentation | Shared validation/auth, its module's application use-cases | Call repositories, contain business rules, expose ORM entities |
| Application | Its module's domain, shared ports, explicitly allowed module application interfaces | Import a concrete DB client or provider SDK |
| Domain | Pure types, policies and repository/event interfaces | Import NestJS, ORM, HTTP, or integration packages |
| Infrastructure | Its module's domain ports, shared persistence, provider adapters | Be imported by another module's domain/application layer |

Use the module dependency list, main/AppModule/worker composition, public exemptions and generation commands in [architecture.md](./architecture.md#runtime-composition-and-lifecycle). Shared schemas/types/status maps live in `@apnatown/shared`; public APIs are REST generated from DTOs. Use-cases own transaction boundaries and invoke repositories only through ports. Domain code never imports presentation schemas. Provider credentials never leave adapters; production authentication/authorization cannot be replaced by fakes.

## Shared layer

Implementation is incremental: the runtime now binds `CLOCK`/`ID_PROVIDER`
through `RuntimePrimitivesModule`; `@apnatown/shared` exports checked `Money`.
The runtime also binds `CURSOR_CODEC`: HMAC-authenticated keysets bind the
operation, sort, filter and authorized scope fingerprint; scope/filter values
are not embedded in plaintext. Endpoint owners supply only non-PII sort keys,
retain database timestamp precision, and validate their tuple shape before
building the parameterized keyset predicate. `PageQuerySchema` owns the shared
20-default/50-cap parsing. `canonicalJson` rejects non-JSON values, cycles and
unsafe integers, with depth 16, 10,000 nodes and 65,536-character bounds.
The flat-error filter registers the starter invariant catalogue and legacy
aliases, exposes only allow-listed field paths, and logs technical codes/status
with correlation IDs rather than exception messages or submitted values.
`withCorrelation` isolates the validated ID across asynchronous HTTP work;
the shared Pino logger includes that context automatically. Job/relay owners
must enter it using the persisted event ID context, not a process-global value.
`EVENT_FACTORY` constructs validated version-1 envelopes with UUIDv7,
aggregate version, UTC time and bounded JSON. `UNIT_OF_WORK` and
`OUTBOX_WRITER` now join real Prisma transactions through opaque handles;
repository adapters can inject the exported `PrismaDatabase`. Connections
open on first unit-of-work use and close on module shutdown, keeping process
probes reachable when the database is unavailable. Foreign, expired and
timed-out handles never fall back to a root client. Appending does not enqueue:
the separate worker's `OutboxRelay` leases at most 20 rows per batch with
`FOR UPDATE SKIP LOCKED`, commits the lease, and enqueues by stable event ID
outside the transaction. The migration launcher provisions the generic
`apnatown.outbox` pg-boss queue; worker startup uses the runtime role with
schema migration and creation disabled. Validated bounds are batch size 1-20
(default 10), polling interval 100-60,000 ms (default 1,000), lease 10-300
seconds (default 30), retry limit 0-10 (default 3), and base delay 100-60,000
ms (default 1,000). Relay retry delay grows linearly by attempt and is capped
at base delay times retry limit plus one; pg-boss retries use exponential
backoff with the base rounded up to seconds and capped at that rounded delay
times retry limit plus one. Exhausted or malformed events become `dead` with a
safe error code, never exception text or event payload in logs. Consumers and
readiness-manifest registration remain deferred, so this relay does not imply
any domain handler is active or make worker readiness true.
Structured failure logs and persisted dead-state exist; a metrics exporter and
operator replay control are still deferred and remain deployment/operations
gates. Do not invent an admin queue screen to close those gaps.
The separate worker also runs bounded shared-runtime expiry cleanup; the
[data-model contract](./data-model.md#shared-runtime-persistence) owns its
configuration and strict deletion boundaries. The API starts no cleanup loop,
and in-progress claims, outbox records and domain records are retained.
The shared `RateLimit` metadata/guard uses one atomic PostgreSQL upsert per
declared window, DB time, a purpose-separated HMAC of either the trusted
request IP or the authenticated principal ID, and fails closed with 503 on
storage failure. It is registered after session/probe enforcement and has no
invented route limits; Auth/feature owners must declare their reviewed policies.
Policies are strict: stable key, 1..100000 hits, 1..86400 seconds, and an
explicit `ip` or server-populated `principal` subject. Fixed epoch-aligned
windows saturate at limit+1 and return 429 with rounded-up `Retry-After`;
only the socket IP is trusted until a proxy policy is explicitly configured.
Signed adjustments still require their owning DTO's explicit permission.
The shared `CommandUnitOfWork` claim/store core and `COMMAND_CONTEXT_FACTORY`
trusted HTTP context/hash builder are implemented, but no HTTP operation is
registered to use them yet. The factory binds canonical requests to their
method, resource, actor and resolved business using a dedicated server key;
its contract is in [data-model](./data-model.md#shared-runtime-persistence).
The transaction wrapper also supports explicit policy-selected `4xx` rejected
outcomes and verifies replay status against the stored receipt; the same
data-model contract defines commit-before-error and rollback boundaries.
Live authorization, HTTP interceptor wiring and module replay policies remain
required before an endpoint can claim idempotency support. These primitives do
not imply live authorization or the Catalog reference below is implemented.
Automated test tooling remains
removed at the user's request; build/static checks are not acceptance evidence
for those deferred runtime contracts.

| Item | Purpose and usage rule |
|---|---|
| Config | Typed env parsing at startup; reject missing/invalid required configuration and never log secrets. |
| Logger + correlation ID | Structured Pino logs; validate/bound incoming correlation headers or generate an ID, propagate across HTTP/outbox/jobs; redact secrets and PII. |
| Exception filter | Map typed domain/validation failures to the stable error contract below; never return stack traces. |
| Validation pipe | Zod DTO allow-lists; reject unknown keys, transform only declared fields, and reuse the same schemas for OpenAPI. |
| CSV/slug/UUID pipes | CSV size/row/type validation and formula-safe export; normalize/validate slugs; reject malformed UUIDs before use-cases. |
| `Money` | Exact integer-paise arithmetic; checked JSON-number serialization per [wire primitives](./data-model.md#json-and-concurrency-representations), never raw BigInt/string coercion. |
| Clock + ID providers | Inject `Clock.now(): Date` and `IdProvider.uuidv7(): string` (`CLOCK`/`ID_PROVIDER`); tests use deterministic fakes, production uses real time/entropy. |
| Opaque-token helper | `OPAQUE_TOKENS` is exported by `RuntimePrimitivesModule` for Auth/Users. Standard Node cryptography generates, hashes and compares high-entropy credentials; the owning flows enforce authorization/expiry. No tokens in logs or idempotency JSON. |
| Pagination | Opaque keyset cursor with stable tie-breaker; default limit and hard cap 50; no offset for feeds/queues. |
| Base repository + unit of work | Shared transaction/pagination primitives only; [opaque transaction contracts](./data-model.md#shared-runtime-persistence) keep Prisma in infrastructure, not use-cases. |
| `@Roles`, `@Capability`, `@Permission(module, action)`, `@Scoped` | Metadata only; protected handlers declare roles or a named owner-issued application capability plus applicable permission/scope. Guards resolve capabilities server-side; never accept a client list. |
| Guards + ownership policy | Verify live role/capability, module/action permission, city/area and ownership. Resolve `X-Business-Kind` against the user's businesses; it grants no privilege, and ambiguous dual ownership is `BUSINESS_CONTEXT_REQUIRED`. Super-admin scope is platform-wide only where specified. |
| Idempotency interceptor | Not yet implemented. The shared transaction claim/store core is available as `COMMAND_UNIT_OF_WORK`; the future interceptor must validate key/hash and prepare server-owned `CommandContext`, and each operation must provide its explicit non-secret result/replay policy. Reauthorize/rehydrate capabilities atomically on replay; never persist bearer/OTP/CSRF/completion plaintext or finish idempotency after the response. |
| Audit interceptor/context | Collect trusted actor/correlation/action metadata only. Application calls Audit-owned `record(tx, entry)` inside the state transaction; an after-response log is not the required audit. |
| Rate-limit guard | Atomic PostgreSQL buckets defined in data-model; shared across API processes, no Redis; Auth attempt/cooldown policy remains authoritative. |
| Outbox publisher + job runner | Application appends outbox in its transaction; a separate relay sends to pg-boss at least once. Consumers deduplicate/reconcile; repositories do not publish. |
| Adapter interfaces + fakes | Ports for payment, OTP/SMS, WhatsApp, email, storage and maps; unit tests inject deterministic fakes. |
| Settings/feature flags | Typed server-side reads; no client-supplied flag may authorize an action. |
| OpenAPI | Generate from DTO/Zod schemas; version REST routes deliberately and publish stable error shapes. |
| i18n message catalogue | `en` and `hi` message keys for user-visible API errors/templates; API returns key and safe parameters, clients render localized copy. |

### Opaque-token helper

`OpaqueTokens` supplies `issue(purpose) -> {token,hash}`,
`hash(purpose,token)` for owner-repository lookup and
`verify(purpose,token,expectedHash) -> boolean`. `SystemOpaqueTokens` uses
Node's `randomBytes(32)` (256 bits), canonical unpadded base64url (43 characters),
purpose-separated SHA-256 (32-byte stored hash), and `timingSafeEqual`.
Supported purposes are `session` and `data-request-completion`; they are
server-selected, never client-controlled. This high-entropy token helper is
not an OTP/password hasher and does not replace `csrf-sync`.

Malformed/non-canonical tokens throw the safe `InvalidOpaqueTokenError`; owner
flows map it to their registered authentication/capability error without
logging the submitted token. A validly encoded mismatch returns `false`.
Invalid stored-hash length is a configuration/data error, not successful
verification or an ordinary credential mismatch.
Only the authorized issuing flow receives plaintext; store the hash in the
owning session/request row. The owner checks row identity, ownership, scope,
expiry and revocation and performs any rotation atomically. No expiry defaults,
session endpoints or deletion-status authentication are implemented by this
helper.

- Given issuance, when a credential is generated, then it has exactly 32 random
  bytes represented by 43 base64url characters, and only its 32-byte hash is
  suitable for persistence.
- Given the issued token and stored hash, when verification uses the same
  purpose, then it succeeds; a changed token or purpose fails. Padding,
  non-canonical encodings, wrong lengths and malformed stored hashes are
  rejected explicitly.

### Error contract

```json
{
  "code": "ORDERS_INVALID_TRANSITION",
  "message_key": "errors.orders.invalidTransition",
  "status": 409,
  "details": { "field": "status" },
  "correlationId": "019a6a8f-0000-7000-8000-000000000001"
}
```

`code` is stable and uppercase; use `<MODULE>_<REASON>` for new codes, retaining existing module-owned codes such as `VALIDATION_ERROR`, `SUGGESTION_SCOPE_DENIED`, `CSRF_INVALID`. Do not rename them in a foundation example. `message_key` is localized by the client; `details` is an allow-listed JSON object (empty `{}` when none), with validation paths but never submitted values. All five fields are required; HTTP status and `status` match, and the correlation header equals `correlationId`. Common codes: `COMMON_VALIDATION_FAILED` (400), `COMMON_UNAUTHENTICATED` (401), `COMMON_FORBIDDEN` (403), `COMMON_NOT_FOUND` (404), `COMMON_CONFLICT` (409), `COMMON_RATE_LIMITED` (429), `COMMON_UNAVAILABLE` (503), `COMMON_INTERNAL_ERROR` (500).

Global filter handles validation, guards, domain/persistence failures and unexpected errors identically (no Nest default envelope, nested `error`, stack or SQL detail). DTO/OpenAPI/client tests assert the flat shape; older nested-envelope examples are not alternative wire formats. Money/IDs/version/cursor/JSON rules live once in [data-model](./data-model.md#json-and-concurrency-representations).

The [starter invariant error catalogue](./data-model.md#starter-invariant-error-catalogue) is kept with shared wire contracts to leave room here for the complete reference. Module specs add codes only for documented failures; never reuse a code for a different condition.

## Catalog reference slice

F-VD-006 / F-AD-006, J9, BR-07/12; [Catalog BE](../catalog/be/catalog.md) owns DTOs/paths/tables/events. This is a **multi-file implementation reference**, not existing/copy-ready scaffold code. Imported collaborators below are explicit contracts to implement, not imaginary framework helpers; names refer to files under `apps/api/src` unless the package path is shown.

| Imported collaborator | Required contract (and binding owner) |
|---|---|
| `shared/persistence/ports`, `shared/events`, `shared/errors` | `CommandContext`, `TxContext`, `CommandUnitOfWork`/`COMMAND_UOW`, `OutboxWriter`/`OUTBOX_WRITER`, `EventFactory`/`EVENT_FACTORY` follow data-model. Pure `DomainError(code,details?)` sets `Error.message=code` and carries safe data to the registered catalogue/filter; no HTTP/Nest import in domain. |
| `shared/auth` | `CurrentCommand`, `Roles`, `Capability`, `Permission`, `Scoped` metadata; DI-backed global guards enforce them. `AccessPolicy`/`ACCESS_POLICY`: `ownedBusiness(tx,ctx)` resolves validated `X-Business-Kind` and returns `{businessId,kind,submitterUserId,cityId,areaId}` after the Business-owned `business.taxonomy-suggest` check: approved matching seller role or narrow editable-applicant capability, always ownership/resolved area, never client privileges. `review(tx,ctx,'catalog',suggestion)` checks live admin/super-admin, `catalog:edit`, stored city/area. `ScopeRegistry.register(key,resolver)` rejects duplicates and validates path ID before resolution. Runtime uses public ownership ports, never Catalog reading Business repositories. |
| `catalog/application/preparation` | `CatalogPreparation(reads,ids,clock)`: `pending(tx,input,owner,ctx)` returns a new version-1 pending entity; `resolution(tx,before,input,ctx)` returns `{next,subcategory?}` with version+1 and state-specific review fields. **Read/validate/plan only**, never persist or open a transaction. See validation rules below. |
| `catalog/domain/taxonomy`, `catalog/domain/reads` | `TaxonomyRepository`/`TAXONOMY`: `insert(tx, NewSubcategory)` only. `CatalogReads`/`CATALOG_READS`: category/active-target lookups and normalized exact/fuzzy candidates inside `tx`; `scope(id)` is a read-only guard projection. `infrastructure/taxonomy` and `infrastructure/reads` implement these ports as `PrismaTaxonomyRepository`/`PrismaCatalogReads`; application never imports their implementations. |
| `catalog/infrastructure/mapping`, `catalog/application/present` | `fromRow(PrismaSuggestion): Suggestion` (`PrismaSuggestion` aliases generated `SubcategorySuggestion`), `insertRow(Suggestion)` and `decisionColumns(Suggestion)` explicitly map fields/UTC dates; decision columns allow only Catalog's review/state/target/version/updatedAt changes, not owner/scope mass assignment. `suggestionDto(Suggestion)` returns Catalog's JSON-safe response/current version, never an ORM object. |
| Runtime/Audit/testing modules | `RuntimeModule` exports shared tokens, `PrismaDatabase`, `ScopeRegistry`, `CLOCK`, `ID_PROVIDER`; `AuditModule` exports `AUDIT_WRITER`. `startCatalogHttpFixture()` uses **real bootstrap + guards + migrated isolated DB**, fixture actors/UUIDs, private fake OTP sink and real cookie/CSRF login; `headers(actor)` supplies those credentials/Origin and a fresh idempotency key, `snapshot(id)` queries actual suggestion/subcategory/outbox/audit rows, `close()` disposes DB/processes. No HTTP authorization mocks. |

Preparation applies Catalog's common normalization (Unicode/case/space folding + `unaccent`), checks exact duplicates including pending suggestions, and returns fuzzy candidates as `SUGGESTION_SIMILARITY_WARNING` unless `allowSimilar === true`; exact matches remain `SUGGESTION_DUPLICATE`. Recheck under transaction/unique constraints. Names use source 2–60 characters; suggestion `nameHi` stays optional. Approval uses existing Hindi or `approvalNameHi`; absence -> `VALIDATION_ERROR`, **never auto-translate**. Direct subcategory creation requires Hindi. Merge needs an active same-category `targetSubcategoryId`, not a new translation; reject needs reason. Creation/slug/matching policy is Catalog-owned; unresolved thresholds/slug rules are alignment gates, not guessed constants.

```ts
// packages/shared/src/catalog/suggestion.dto.ts (exported by @apnatown/shared/catalog)
import { z } from 'zod';
const name = z.string().trim().min(2).max(60);
const expectedVersion = z.number().int().min(1).max(2147483647);
export const suggestSubcategorySchema = z.object({
  categoryId: z.string().uuid(), nameEn: name, nameHi: name.optional(),
  reason: z.string().trim().min(1).optional(), allowSimilar: z.boolean().optional(),
}).strict();
export const decideSuggestionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), expectedVersion, approvalNameHi: name.optional() }).strict(),
  z.object({ action: z.literal('reject'), expectedVersion, reason: z.string().trim().min(1) }).strict(),
  z.object({ action: z.literal('merge'), expectedVersion, targetSubcategoryId: z.string().uuid() }).strict(),
]);
export type SuggestInput = z.infer<typeof suggestSubcategorySchema>;
export type DecisionInput = z.infer<typeof decideSuggestionSchema>;
```

```ts
// modules/catalog/domain/suggestion.ts — pure types/rules, no DTO/schema import
import { DomainError } from '../../../shared/errors';
import type { TxContext } from '../../../shared/persistence/ports';
export type Suggestion = {
  id: string; businessId: string; submitterUserId: string; cityId: string; areaId: string;
  categoryId: string; nameEn: string; nameHi: string | null; normalizedName: string; reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'merged'; version: number;
  reviewedBy: string | null; reviewedAt: string | null; rejectionReason: string | null;
  subcategoryId: string | null; mergedIntoSubcategoryId: string | null; createdAt: string; updatedAt: string;
};
export type SuggestionEventType = `catalog.subcategory_suggestion.${'submitted' | 'approved' | 'rejected' | 'merged'}`;
export const SUGGESTIONS = Symbol('catalog.suggestions');
export interface SuggestionRepository {
  lock(tx: TxContext, id: string): Promise<Suggestion | null>;
  insert(tx: TxContext, row: Suggestion): Promise<void>;
  compareAndSet(tx: TxContext, before: Suggestion, next: Suggestion): Promise<boolean>;
}
export function assertPending(s: Pick<Suggestion, 'status' | 'version'>, expected: number) {
  if (s.version !== expected) throw new DomainError('CATALOG_VERSION_CONFLICT');
  if (s.status !== 'pending') throw new DomainError('SUGGESTION_STATE_INVALID');
}
```

```ts
// modules/catalog/infrastructure/suggestions.ts — persistence only
import type { Suggestion, SuggestionRepository } from '../domain/suggestion';
import type { TxContext } from '../../../shared/persistence/ports';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { fromRow, insertRow, decisionColumns } from './mapping';
export class PrismaSuggestionRepository implements SuggestionRepository {
  constructor(private readonly db: PrismaDatabase) {}
  async lock(tx: TxContext, id: string) {
    const db = this.db.client(tx);
    const rows = await db.$queryRaw<{ id: string }[]>`SELECT id FROM subcategory_suggestions WHERE id = ${id}::uuid FOR UPDATE`;
    return rows.length ? fromRow(await db.subcategorySuggestion.findUniqueOrThrow({ where: { id } })) : null;
  }
  async insert(tx: TxContext, row: Suggestion) {
    await this.db.client(tx).subcategorySuggestion.create({ data: insertRow(row) });
  }
  async compareAndSet(tx: TxContext, before: Suggestion, next: Suggestion) {
    const changed = await this.db.client(tx).subcategorySuggestion.updateMany({
      where: { id: before.id, version: before.version, status: 'pending' }, data: decisionColumns(next),
    });
    return changed.count === 1;
  }
}
```

```ts
// modules/catalog/application/commands.ts
import type { SuggestInput, DecisionInput } from '@apnatown/shared/catalog';
import { assertPending, type Suggestion, type SuggestionRepository } from '../domain/suggestion';
import type { TaxonomyRepository } from '../domain/taxonomy';
import { CatalogPreparation } from './preparation';
import { suggestionDto } from './present';
import { DomainError } from '../../../shared/errors';
import type { CommandContext, CommandUnitOfWork, TxContext } from '../../../shared/persistence/ports';
import type { AccessPolicy } from '../../../shared/auth';
import type { OutboxWriter, EventFactory } from '../../../shared/events';
import type { AuditWriter } from '../../audit/application/audit-writer';
export class CatalogCommands {
  constructor(private readonly uow: CommandUnitOfWork, private readonly repo: SuggestionRepository,
    private readonly taxonomy: TaxonomyRepository, private readonly prep: CatalogPreparation,
    private readonly access: AccessPolicy, private readonly outbox: OutboxWriter,
    private readonly audit: AuditWriter, private readonly events: EventFactory) {}
  submit(input: SuggestInput, ctx: CommandContext) {
    return this.uow.run(ctx, async tx => {
      const owner = await this.access.ownedBusiness(tx, ctx);
      const next = await this.prep.pending(tx, input, owner, ctx);
      await this.repo.insert(tx, next);
      await this.record(tx, 'submitted', next, ctx);
      return suggestionDto(next);
    });
  }
  decide(id: string, input: DecisionInput, ctx: CommandContext) {
    return this.uow.run(ctx, async tx => {
      const before = await this.repo.lock(tx, id);
      if (!before) throw new DomainError('SUGGESTION_NOT_FOUND');
      await this.access.review(tx, ctx, 'catalog', before);
      assertPending(before, input.expectedVersion);
      if (input.action === 'approve' && !(before.nameHi ?? input.approvalNameHi))
        throw new DomainError('VALIDATION_ERROR', { field: 'approvalNameHi' });
      const { next, subcategory } = await this.prep.resolution(tx, before, input, ctx);
      if (subcategory) await this.taxonomy.insert(tx, subcategory);
      if (!await this.repo.compareAndSet(tx, before, next)) throw new DomainError('CATALOG_VERSION_CONFLICT');
      const verb = input.action === 'approve' ? 'approved' : input.action === 'reject' ? 'rejected' : 'merged';
      await this.record(tx, verb, next, ctx);
      if (subcategory) await this.outbox.append(tx, this.events.create('catalog.taxonomy.changed',
        { type: 'subcategory', id: subcategory.id, version: 1 }, { categoryId: next.categoryId, subcategoryId: subcategory.id }, ctx.correlationId));
      await this.audit.record(tx, { actor: ctx.actor, action: `catalog.subcategory_suggestion.${verb}`,
        entityType: 'subcategory_suggestion', entityId: id, cityId: next.cityId, areaId: next.areaId,
        summary: `catalog.subcategory_suggestion.${verb}`, before: suggestionDto(before), after: suggestionDto(next) });
      return suggestionDto(next);
    });
  }
  private record(tx: TxContext, verb: 'submitted' | 'approved' | 'rejected' | 'merged', s: Suggestion, ctx: CommandContext) {
    return this.outbox.append(tx, this.events.create(`catalog.subcategory_suggestion.${verb}`,
      { type: 'subcategory_suggestion', id: s.id, version: s.version },
      { suggestionId: s.id, categoryId: s.categoryId, status: s.status, version: s.version,
        submitterUserId: s.submitterUserId, businessId: s.businessId, cityId: s.cityId, areaId: s.areaId,
        subcategoryId: s.subcategoryId, mergedIntoSubcategoryId: s.mergedIntoSubcategoryId }, ctx.correlationId));
  }
}
```

```ts
// modules/catalog/presentation/catalog.controller.ts
import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { suggestSubcategorySchema, decideSuggestionSchema, type SuggestInput, type DecisionInput } from '@apnatown/shared/catalog';
import { CatalogCommands } from '../application/commands';
import { CurrentCommand, Capability, Permission, Roles, Scoped } from '../../../shared/auth';
import { Idempotent } from '../../../shared/idempotency';
import { ZodPipe } from '../../../shared/validation';
import type { CommandContext } from '../../../shared/persistence/ports';
@Controller('catalog')
export class CatalogController {
  constructor(private readonly commands: CatalogCommands) {}
  @Post('subcategory-suggestions') @HttpCode(201)
  @Capability('business.taxonomy-suggest') @Scoped('business-owner') @Idempotent('catalog.suggestion.submit', suggestSubcategorySchema)
  submit(@Body(new ZodPipe(suggestSubcategorySchema, 'VALIDATION_ERROR')) input: SuggestInput, @CurrentCommand() ctx: CommandContext) {
    return this.commands.submit(input, ctx);
  }
  @Post('admin/subcategory-suggestions/:id/decision') @HttpCode(200)
  @Roles('admin', 'super_admin') @Permission('catalog', 'edit') @Scoped('catalog.suggestion') @Idempotent('catalog.suggestion.decide', decideSuggestionSchema)
  decide(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(decideSuggestionSchema, 'VALIDATION_ERROR')) input: DecisionInput, @CurrentCommand() ctx: CommandContext) {
    return this.commands.decide(id, input, ctx);
  }
}
```

`ZodPipe(schema,code)` runs strict `safeParse`; `Idempotent(operation,schema)` requires the header and uses that same schema for the canonical request hash in `CurrentCommand` (plus validated resource path). The registered HTTP status is saved with the result. Runtime binds the global guard/filter/pipe/interceptor chain once; no service locator or guard replacement:

```ts
// modules/catalog/catalog.module.ts
import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { RuntimeModule } from '../../shared/runtime.module';
import { PrismaDatabase } from '../../shared/persistence/prisma-database';
import { COMMAND_UOW, type CommandUnitOfWork } from '../../shared/persistence/ports';
import { ACCESS_POLICY, ScopeRegistry, type AccessPolicy } from '../../shared/auth';
import { CLOCK, ID_PROVIDER, type Clock, type IdProvider } from '../../shared/clock-id';
import { OUTBOX_WRITER, EVENT_FACTORY, type OutboxWriter, type EventFactory } from '../../shared/events';
import { AuditModule } from '../audit/audit.module';
import { AUDIT_WRITER, type AuditWriter } from '../audit/application/audit-writer';
import { CatalogController } from './presentation/catalog.controller';
import { CatalogCommands } from './application/commands';
import { CatalogPreparation } from './application/preparation';
import { SUGGESTIONS, type SuggestionRepository } from './domain/suggestion';
import { TAXONOMY, type TaxonomyRepository } from './domain/taxonomy';
import { PrismaSuggestionRepository } from './infrastructure/suggestions';
import { PrismaTaxonomyRepository } from './infrastructure/taxonomy';
import { CATALOG_READS, type CatalogReads } from './domain/reads';
import { PrismaCatalogReads } from './infrastructure/reads';
@Module({
  imports: [RuntimeModule, AuditModule], controllers: [CatalogController],
  providers: [
    { provide: SUGGESTIONS, useFactory: (db: PrismaDatabase) => new PrismaSuggestionRepository(db), inject: [PrismaDatabase] },
    { provide: TAXONOMY, useFactory: (db: PrismaDatabase) => new PrismaTaxonomyRepository(db), inject: [PrismaDatabase] },
    { provide: CATALOG_READS, useFactory: (db: PrismaDatabase) => new PrismaCatalogReads(db), inject: [PrismaDatabase] },
    { provide: CatalogPreparation, useFactory: (reads: CatalogReads, ids: IdProvider, clock: Clock) => new CatalogPreparation(reads, ids, clock), inject: [CATALOG_READS, ID_PROVIDER, CLOCK] },
    { provide: CatalogCommands, useFactory: (uow: CommandUnitOfWork, repo: SuggestionRepository, taxonomy: TaxonomyRepository,
        prep: CatalogPreparation, access: AccessPolicy, outbox: OutboxWriter, audit: AuditWriter, events: EventFactory) =>
        new CatalogCommands(uow, repo, taxonomy, prep, access, outbox, audit, events),
      inject: [COMMAND_UOW, SUGGESTIONS, TAXONOMY, CatalogPreparation, ACCESS_POLICY, OUTBOX_WRITER, AUDIT_WRITER, EVENT_FACTORY] },
  ], exports: [CatalogCommands],
})
export class CatalogModule implements OnModuleInit {
  constructor(@Inject(CATALOG_READS) private readonly reads: CatalogReads, private readonly scopes: ScopeRegistry) {}
  onModuleInit() { this.scopes.register('catalog.suggestion', id => this.reads.scope(id)); }
}
```

No sample method imports Prisma into application/domain or publishes an event directly. Repository uniqueness errors are translated to the existing Catalog duplicate/conflict codes; they do not choose “merge” or “approve”. The approval target insert, versioned suggestion change, dotted outbox events, audit and idempotent DTO commit together.

```ts
// domain/suggestion.test.ts
import { expect, it } from 'vitest';
import { assertPending } from './suggestion';
it('Given version 3 pending, When version 3/2 or terminal is checked, Then only the current pending command passes', () => {
  expect(() => assertPending({ status: 'pending', version: 3 }, 3)).not.toThrow();
  expect(() => assertPending({ status: 'pending', version: 3 }, 2)).toThrow('CATALOG_VERSION_CONFLICT');
  expect(() => assertPending({ status: 'merged', version: 4 }, 4)).toThrow('SUGGESTION_STATE_INVALID');
});
```

```ts
// presentation/catalog.http.test.ts
import { beforeEach, afterEach, expect, it } from 'vitest';
import request from 'supertest';
import { startCatalogHttpFixture, type CatalogHttpFixture } from '../testing/catalog-http-fixture';
let h: CatalogHttpFixture;
beforeEach(async () => { h = await startCatalogHttpFixture(); });
afterEach(async () => { await h.close(); });
it.each(['outsideAdmin', 'catalogViewer', 'customer'] as const)('Given %s, When deciding by HTTP, Then denied with no DB writes', async actor => {
  const before = await h.snapshot(h.pending.id);
  await request(h.app.getHttpServer()).post(`/api/catalog/admin/subcategory-suggestions/${h.pending.id}/decision`)
    .set(await h.headers(actor)).send({ action: 'approve', expectedVersion: h.pending.version, approvalNameHi: h.approvalNameHi }).expect(403);
  expect(await h.snapshot(h.pending.id)).toEqual(before);
});
it('Given in-scope admin, When approving, Then current version and real outbox/audit rows commit', async () => {
  const res = await request(h.app.getHttpServer()).post(`/api/catalog/admin/subcategory-suggestions/${h.pending.id}/decision`)
    .set(await h.headers('inScopeAdmin')).send({ action: 'approve', expectedVersion: h.pending.version, approvalNameHi: h.approvalNameHi }).expect(200);
  expect(res.body.version).toBe(h.pending.version + 1);
  const events = await h.db.outboxEvent.findMany({ where: { aggregateId: h.pending.id } });
  expect(events.map(e => e.type)).toEqual(['catalog.subcategory_suggestion.approved']);
  expect(await h.db.auditLog.count({ where: { entityId: h.pending.id } })).toBe(1);
});
```

Additional Given/When/Then HTTP acceptance: given missing session/CSRF, when mutating, then 401/403 with the flat envelope; given spoofed business/city/area fields or a non-owner business context, when suggesting, then validation/ownership denial; given an exact/fuzzy duplicate, when submitting, then reject/warn with explicit `allowSimilar` for fuzzy only; given missing suggestion Hindi, when approving without/with `approvalNameHi`, then validation failure/bilingual creation; given merge target under another category, when merging, then 422 and no writes; given competing version-N decisions or failed audit/outbox insert, when committing, then one winner or complete rollback. Assert actual DB rows with workers paused, then start the relay separately to test delivery—there is no nonexistent `outbox.publish` mock.
