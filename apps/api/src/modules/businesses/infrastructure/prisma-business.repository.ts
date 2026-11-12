import { Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import type {
  BillingDraft,
  BusinessDocumentKind,
  BusinessHoursEntry,
  BusinessKind,
  BusinessSettings,
  BusinessStatus,
} from '@apnatown/shared/businesses';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  AdminVisibility,
  BusinessAggregate,
  BusinessChanges,
  BusinessRepository,
  StoredBilling,
  StoredBusiness,
  StoredCategoryLink,
  StoredDocument,
} from '../domain/business';

/** ISO-8601 UTC text with microseconds (matches `TimestampSchema`). */
const timestamp = (column: string) =>
  Prisma.raw(
    `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  );

const businessColumns = Prisma.sql`
  b.id, b.owner_user_id AS "ownerUserId", b.kind, b.status,
  b.name_en AS "nameEn", b.name_hi AS "nameHi", b.slug, b.description,
  b.city_id AS "cityId", b.area_id AS "areaId", b.address_text AS "addressText",
  ST_Y(b.location::geometry) AS lat, ST_X(b.location::geometry) AS lng,
  b.phone_e164 AS "phoneE164", b.whatsapp_e164 AS "whatsappE164", b.email,
  b.instagram_url AS "instagramUrl", b.youtube_url AS "youtubeUrl",
  b.facebook_url AS "facebookUrl", b.logo_asset_id AS "logoAssetId",
  b.cover_asset_id AS "coverAssetId",
  ${timestamp('b.verified_at')} AS "verifiedAt",
  ${timestamp('b.submitted_at')} AS "submittedAt",
  b.review_reason AS "reviewReason", b.reviewed_by AS "reviewedBy",
  ${timestamp('b.reviewed_at')} AS "reviewedAt", b.version,
  ${timestamp('b.deleted_at')} AS "deletedAt",
  ${timestamp('b.created_at')} AS "createdAt",
  ${timestamp('b.updated_at')} AS "updatedAt"`;

const PROFILE_COLUMNS: Readonly<
  Record<Exclude<keyof BusinessChanges, 'location'>, string>
> = {
  kind: 'kind',
  nameEn: 'name_en',
  nameHi: 'name_hi',
  description: 'description',
  cityId: 'city_id',
  areaId: 'area_id',
  addressText: 'address_text',
  phoneE164: 'phone_e164',
  whatsappE164: 'whatsapp_e164',
  email: 'email',
  instagramUrl: 'instagram_url',
  youtubeUrl: 'youtube_url',
  facebookUrl: 'facebook_url',
  logoAssetId: 'logo_asset_id',
  coverAssetId: 'cover_asset_id',
};
const UUID_COLUMNS = new Set([
  'city_id',
  'area_id',
  'logo_asset_id',
  'cover_asset_id',
]);

function visible(visibility: AdminVisibility): Prisma.Sql {
  if (visibility.platformWide) return Prisma.sql`TRUE`;
  return Prisma.sql`(b.area_id = ANY(${[...visibility.areaIds]}::uuid[])
    OR b.city_id = ANY(${[...visibility.cityIds]}::uuid[]))`;
}

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

@Injectable()
export class PrismaBusinessRepository implements BusinessRepository {
  constructor(private readonly database: PrismaDatabase) {}

  savedCards(tx: TxContext, ids: readonly string[]) {
    return this.database.client(tx).$queryRaw<
      Array<{ id: string; labelEn: string; labelHi: string | null }>
    >`
      SELECT b.id, b.name_en AS "labelEn", b.name_hi AS "labelHi"
      FROM businesses b
      JOIN users u ON u.id = b.owner_user_id
      WHERE b.id = ANY(${[...ids]}::uuid[])
        AND b.status = 'approved' AND b.deleted_at IS NULL
        AND b.name_en IS NOT NULL
        AND u.account_status = 'active' AND u.deleted_at IS NULL`;
  }

  async find(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredBusiness | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredBusiness[]>(
      Prisma.sql`SELECT ${businessColumns} FROM businesses b
        WHERE b.id = ${id}::uuid
        ${lock ? Prisma.sql`FOR UPDATE OF b` : Prisma.empty}`,
    );
    return rows[0] ?? null;
  }

  ownedBy(
    tx: TxContext,
    input: { ownerUserId: string; kind?: BusinessKind; lock?: boolean },
  ): Promise<StoredBusiness[]> {
    return this.database.client(tx).$queryRaw<StoredBusiness[]>(
      Prisma.sql`SELECT ${businessColumns} FROM businesses b
        WHERE b.owner_user_id = ${input.ownerUserId}::uuid
          AND b.deleted_at IS NULL
          ${input.kind ? Prisma.sql`AND b.kind = ${input.kind}` : Prisma.empty}
        ORDER BY b.kind
        ${input.lock ? Prisma.sql`FOR UPDATE OF b` : Prisma.empty}`,
    );
  }

  async findPublicBySlug(
    tx: TxContext,
    slug: string,
  ): Promise<StoredBusiness | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredBusiness[]>(
      Prisma.sql`SELECT ${businessColumns} FROM businesses b
        WHERE b.slug = ${slug} AND b.status = 'approved'
          AND b.deleted_at IS NULL`,
    );
    return rows[0] ?? null;
  }

  async aggregate(
    tx: TxContext,
    business: StoredBusiness,
  ): Promise<BusinessAggregate> {
    const client = this.database.client(tx);
    const [categories, hours, settings] = await Promise.all([
      client.$queryRaw<StoredCategoryLink[]>(
        Prisma.sql`SELECT category_id AS "categoryId", is_primary AS "isPrimary"
          FROM business_categories WHERE business_id = ${business.id}::uuid
          ORDER BY is_primary DESC, created_at, category_id`,
      ),
      client.$queryRaw<BusinessHoursEntry[]>(
        Prisma.sql`SELECT day_of_week::int AS "dayOfWeek",
            to_char(opens_at, 'HH24:MI') AS "opensAt",
            to_char(closes_at, 'HH24:MI') AS "closesAt",
            is_closed AS "isClosed"
          FROM business_hours WHERE business_id = ${business.id}::uuid
          ORDER BY day_of_week`,
      ),
      client.$queryRaw<BusinessSettings[]>(
        Prisma.sql`SELECT temporarily_closed AS "temporarilyClosed",
            delivery_method AS "deliveryMethod",
            delivery_radius_km::float8 AS "deliveryRadiusKm",
            delivery_fee_paise::float8 AS "deliveryFeePaise",
            minimum_order_paise::float8 AS "minimumOrderPaise",
            pickup_enabled AS "pickupEnabled",
            pickup_instructions AS "pickupInstructions",
            service_radius_km::float8 AS "serviceRadiusKm",
            service_area AS "serviceArea",
            gallery_media_default AS "galleryMediaDefault"
          FROM business_settings WHERE business_id = ${business.id}::uuid`,
      ),
    ]);
    const stored = settings[0];
    if (!stored) throw new Error('BUSINESS_SETTINGS_MISSING');
    return { business, categories, hours, settings: stored };
  }

  async insertDraft(
    tx: TxContext,
    row: {
      id: string;
      ownerUserId: string;
      kind: BusinessKind;
      phoneE164: string;
      at: Date;
    },
  ): Promise<boolean> {
    const client = this.database.client(tx);
    const inserted = await client.$executeRaw`
      INSERT INTO businesses (id, owner_user_id, kind, status, phone_e164,
        version, created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.ownerUserId}::uuid, ${row.kind}, 'draft',
        ${row.phoneE164}, 1, ${row.at}, ${row.at})
      ON CONFLICT (owner_user_id, kind) DO NOTHING`;
    if (inserted !== 1) return false;
    await client.$executeRaw`
      INSERT INTO business_settings (business_id, created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.at}, ${row.at})`;
    return true;
  }

  async updateProfile(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      changes: BusinessChanges;
      at: Date;
    },
  ): Promise<boolean> {
    const sets: Prisma.Sql[] = [];
    for (const [key, column] of Object.entries(PROFILE_COLUMNS) as [
      keyof typeof PROFILE_COLUMNS,
      string,
    ][]) {
      const value = input.changes[key];
      if (value === undefined) continue;
      sets.push(
        UUID_COLUMNS.has(column)
          ? Prisma.sql`${Prisma.raw(column)} = ${value}::uuid`
          : Prisma.sql`${Prisma.raw(column)} = ${value}`,
      );
    }
    const location = input.changes.location;
    if (location !== undefined)
      sets.push(
        location === null
          ? Prisma.sql`location = NULL`
          : Prisma.sql`location = ST_SetSRID(ST_MakePoint(${location.lng}::float8,
              ${location.lat}::float8), 4326)::geography`,
      );
    sets.push(
      Prisma.sql`version = version + 1`,
      Prisma.sql`updated_at = ${input.at}`,
    );
    const count = await this.database.client(tx).$executeRaw(
      Prisma.sql`UPDATE businesses SET ${Prisma.join(sets, ', ')}
        WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
          AND deleted_at IS NULL`,
    );
    return count === 1;
  }

  async replaceCategories(
    tx: TxContext,
    businessId: string,
    categoryIds: readonly string[],
    primaryCategoryId: string | null,
    at: Date,
  ): Promise<void> {
    const client = this.database.client(tx);
    await client.$executeRaw`
      DELETE FROM business_categories WHERE business_id = ${businessId}::uuid`;
    if (!categoryIds.length) return;
    await client.$executeRaw(
      Prisma.sql`INSERT INTO business_categories
          (business_id, category_id, is_primary, created_at)
        SELECT ${businessId}::uuid, item.id,
          COALESCE(item.id = ${primaryCategoryId}::uuid, false),
          ${at}::timestamptz + (item.ord - 1) * interval '1 microsecond'
        FROM unnest(${[...categoryIds]}::uuid[]) WITH ORDINALITY AS item(id, ord)`,
    );
  }

  async replaceHours(
    tx: TxContext,
    businessId: string,
    hours: readonly BusinessHoursEntry[],
  ): Promise<void> {
    const client = this.database.client(tx);
    await client.$executeRaw`
      DELETE FROM business_hours WHERE business_id = ${businessId}::uuid`;
    if (!hours.length) return;
    await client.$executeRaw(
      Prisma.sql`INSERT INTO business_hours
          (business_id, day_of_week, opens_at, closes_at, is_closed)
        VALUES ${Prisma.join(
          hours.map(
            (
              day,
            ) => Prisma.sql`(${businessId}::uuid, ${day.dayOfWeek}::smallint,
              ${day.opensAt}::time, ${day.closesAt}::time, ${day.isClosed})`,
          ),
        )}`,
    );
  }

  async updateSettings(
    tx: TxContext,
    businessId: string,
    settings: BusinessSettings,
    at: Date,
  ): Promise<void> {
    await this.database.client(tx).$executeRaw`
      UPDATE business_settings SET
        temporarily_closed = ${settings.temporarilyClosed},
        delivery_method = ${settings.deliveryMethod},
        delivery_radius_km = ${settings.deliveryRadiusKm}::numeric,
        delivery_fee_paise = ${settings.deliveryFeePaise}::bigint,
        minimum_order_paise = ${settings.minimumOrderPaise}::bigint,
        pickup_enabled = ${settings.pickupEnabled},
        pickup_instructions = ${settings.pickupInstructions},
        service_radius_km = ${settings.serviceRadiusKm}::numeric,
        service_area = ${settings.serviceArea},
        gallery_media_default = ${settings.galleryMediaDefault},
        updated_at = ${at}
      WHERE business_id = ${businessId}::uuid`;
  }

  async transition(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status: BusinessStatus;
      slug?: string;
      submittedAt?: Date;
      review?: { reason: string | null; reviewedBy: string } | 'clear';
      at: Date;
    },
  ): Promise<boolean> {
    const sets: Prisma.Sql[] = [Prisma.sql`status = ${input.status}`];
    if (input.slug !== undefined)
      sets.push(Prisma.sql`slug = COALESCE(slug, ${input.slug})`);
    if (input.submittedAt)
      sets.push(Prisma.sql`submitted_at = ${input.submittedAt}`);
    if (input.review === 'clear') sets.push(Prisma.sql`review_reason = NULL`);
    else if (input.review)
      sets.push(
        Prisma.sql`review_reason = ${input.review.reason}`,
        Prisma.sql`reviewed_by = ${input.review.reviewedBy}::uuid`,
        Prisma.sql`reviewed_at = ${input.at}`,
      );
    sets.push(
      Prisma.sql`version = version + 1`,
      Prisma.sql`updated_at = ${input.at}`,
    );
    const count = await this.database.client(tx).$executeRaw(
      Prisma.sql`UPDATE businesses SET ${Prisma.join(sets, ', ')}
        WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
          AND deleted_at IS NULL`,
    );
    return count === 1;
  }

  async softDelete(
    tx: TxContext,
    input: { id: string; expectedVersion: number; at: Date },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE businesses SET deleted_at = ${input.at}, version = version + 1,
        updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
        AND deleted_at IS NULL`;
    return count === 1;
  }

  async allocateSlug(tx: TxContext, base: string): Promise<string> {
    const client = this.database.client(tx);
    // Serializes concurrent submissions sharing a slug base until commit.
    await client.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${`business.slug:${base}`}, 0))`;
    const rows = await client.$queryRaw<{ slug: string }[]>`
      SELECT slug FROM businesses
      WHERE slug = ${base} OR slug LIKE ${`${base}-%`}`;
    const taken = new Set(rows.map((row) => row.slug));
    if (!taken.has(base)) return base;
    for (let suffix = 2; ; suffix += 1) {
      const candidate = `${base}-${suffix}`;
      if (!taken.has(candidate)) return candidate;
    }
  }

  async insertDocument(
    tx: TxContext,
    row: {
      id: string;
      businessId: string;
      documentKind: BusinessDocumentKind;
      assetId: string;
      uploadedBy: string;
      at: Date;
    },
  ): Promise<StoredDocument> {
    const rows = await this.database.client(tx).$queryRaw<StoredDocument[]>(
      Prisma.sql`INSERT INTO business_documents
          (id, business_id, document_kind, asset_id, uploaded_by, created_at)
        VALUES (${row.id}::uuid, ${row.businessId}::uuid, ${row.documentKind},
          ${row.assetId}::uuid, ${row.uploadedBy}::uuid, ${row.at})
        RETURNING id, business_id AS "businessId",
          document_kind AS "documentKind", asset_id AS "assetId",
          ${timestamp('created_at')} AS "createdAt"`,
    );
    return rows[0]!;
  }

  documents(tx: TxContext, businessId: string): Promise<StoredDocument[]> {
    return this.database.client(tx).$queryRaw<StoredDocument[]>(
      Prisma.sql`SELECT id, business_id AS "businessId",
          document_kind AS "documentKind", asset_id AS "assetId",
          ${timestamp('created_at')} AS "createdAt"
        FROM business_documents WHERE business_id = ${businessId}::uuid
        ORDER BY created_at DESC, id DESC LIMIT 50`,
    );
  }

  scopedPage(
    tx: TxContext,
    input: {
      statuses: readonly BusinessStatus[];
      kind?: BusinessKind;
      q?: string;
      visibility: AdminVisibility;
      after?: [string, string];
      limit: number;
    },
  ): Promise<StoredBusiness[]> {
    const q = input.q ? likePattern(input.q) : null;
    return this.database.client(tx).$queryRaw<StoredBusiness[]>(
      Prisma.sql`SELECT ${businessColumns} FROM businesses b
        WHERE b.deleted_at IS NULL
          AND b.status = ANY(${[...input.statuses]}::text[])
          AND ${visible(input.visibility)}
          ${input.kind ? Prisma.sql`AND b.kind = ${input.kind}` : Prisma.empty}
          ${
            q
              ? Prisma.sql`AND (b.name_en ILIKE ${q} OR b.name_hi ILIKE ${q})`
              : Prisma.empty
          }
          ${
            input.after
              ? Prisma.sql`AND (b.created_at, b.id) >
                  (${input.after[0]}::timestamptz, ${input.after[1]}::uuid)`
              : Prisma.empty
          }
        ORDER BY b.created_at, b.id
        LIMIT ${input.limit + 1}`,
    );
  }

  async scopedCounts(
    tx: TxContext,
    visibility: AdminVisibility,
  ): Promise<{
    pending: number;
    approvedShop: number;
    approvedProvider: number;
  }> {
    const rows = await this.database
      .client(tx)
      .$queryRaw<
        { pending: number; approvedShop: number; approvedProvider: number }[]
      >(
        Prisma.sql`SELECT
          count(*) FILTER (WHERE b.status = 'pending')::int AS pending,
          count(*) FILTER (WHERE b.status = 'approved' AND b.kind = 'shop')::int
            AS "approvedShop",
          count(*) FILTER (WHERE b.status = 'approved' AND b.kind = 'provider')::int
            AS "approvedProvider"
        FROM businesses b
        WHERE b.deleted_at IS NULL AND ${visible(visibility)}`,
      );
    return rows[0]!;
  }

  async primaryCategories(
    tx: TxContext,
    businessIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (!businessIds.length) return new Map();
    const rows = await this.database
      .client(tx)
      .$queryRaw<{ businessId: string; categoryId: string }[]>(
        Prisma.sql`SELECT business_id AS "businessId", category_id AS "categoryId"
        FROM business_categories
        WHERE is_primary AND business_id = ANY(${[...businessIds]}::uuid[])`,
      );
    return new Map(rows.map((row) => [row.businessId, row.categoryId]));
  }

  publicPage(
    tx: TxContext,
    input: {
      businessIds?: readonly string[];
      kind?: BusinessKind;
      categoryIds?: readonly string[];
      after?: [string, string];
      limit: number;
    },
  ): Promise<StoredBusiness[]> {
    return this.database.client(tx).$queryRaw<StoredBusiness[]>(
      Prisma.sql`SELECT ${businessColumns} FROM businesses b
        WHERE b.status = 'approved' AND b.deleted_at IS NULL
          ${
            input.businessIds
              ? Prisma.sql`AND b.id = ANY(${[...input.businessIds]}::uuid[])`
              : Prisma.empty
          }
          ${input.kind ? Prisma.sql`AND b.kind = ${input.kind}` : Prisma.empty}
          ${
            input.categoryIds
              ? Prisma.sql`AND EXISTS (SELECT 1 FROM business_categories c
                  WHERE c.business_id = b.id
                    AND c.category_id = ANY(${[...input.categoryIds]}::uuid[]))`
              : Prisma.empty
          }
          ${
            input.after
              ? Prisma.sql`AND (b.created_at, b.id) >
                  (${input.after[0]}::timestamptz, ${input.after[1]}::uuid)`
              : Prisma.empty
          }
        ORDER BY b.created_at, b.id
        LIMIT ${input.limit + 1}`,
    );
  }

  findMany(tx: TxContext, ids: readonly string[]): Promise<StoredBusiness[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.database.client(tx).$queryRaw<StoredBusiness[]>(
      Prisma.sql`SELECT ${businessColumns} FROM businesses b
        WHERE b.id = ANY(${[...ids]}::uuid[]) ORDER BY b.id`,
    );
  }

  async findBilling(
    tx: TxContext,
    businessId: string,
    lock = false,
  ): Promise<StoredBilling | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredBilling[]>(
      Prisma.sql`SELECT business_id AS "businessId", draft,
          approved_snapshot AS "approvedSnapshot",
          review_status AS "reviewStatus", version,
          approved_version AS "approvedVersion",
          review_reason AS "reviewReason",
          verification_evidence_ref AS "verificationEvidenceRef",
          reviewed_by AS "reviewedBy",
          ${timestamp('reviewed_at')} AS "reviewedAt"
        FROM business_billing_profiles
        WHERE business_id = ${businessId}::uuid
        ${lock ? Prisma.sql`FOR UPDATE` : Prisma.empty}`,
    );
    return rows[0] ?? null;
  }

  async saveBillingDraft(
    tx: TxContext,
    input: { businessId: string; draft: BillingDraft; at: Date },
  ): Promise<void> {
    const draft = JSON.stringify(input.draft);
    await this.database.client(tx).$executeRaw`
      INSERT INTO business_billing_profiles
        (business_id, draft, review_status, version, created_at, updated_at)
      VALUES (${input.businessId}::uuid, ${draft}::jsonb, 'pending', 1,
        ${input.at}, ${input.at})
      ON CONFLICT (business_id) DO UPDATE SET
        draft = EXCLUDED.draft, review_status = 'pending',
        version = business_billing_profiles.version + 1,
        review_reason = NULL, verification_evidence_ref = NULL,
        reviewed_by = NULL, reviewed_at = NULL, updated_at = EXCLUDED.updated_at`;
  }

  async decideBilling(
    tx: TxContext,
    input: {
      businessId: string;
      expectedVersion: number;
      approved: {
        snapshot: JsonValue;
        approvedVersion: number;
        evidenceRef: string;
      } | null;
      reason: string | null;
      reviewedBy: string;
      at: Date;
    },
  ): Promise<boolean> {
    const approved = input.approved;
    const count = await this.database.client(tx).$executeRaw(
      Prisma.sql`UPDATE business_billing_profiles SET
          review_status = ${approved ? 'approved' : 'rejected'},
          ${
            approved
              ? Prisma.sql`approved_snapshot = ${JSON.stringify(approved.snapshot)}::jsonb,
                  approved_version = ${approved.approvedVersion},
                  verification_evidence_ref = ${approved.evidenceRef},`
              : Prisma.empty
          }
          review_reason = ${input.reason},
          reviewed_by = ${input.reviewedBy}::uuid, reviewed_at = ${input.at},
          version = version + 1, updated_at = ${input.at}
        WHERE business_id = ${input.businessId}::uuid
          AND version = ${input.expectedVersion} AND review_status = 'pending'`,
    );
    return count === 1;
  }

  async recordView(
    tx: TxContext,
    input: { businessId: string; subjectHash: Buffer; windowStart: Date },
  ): Promise<boolean> {
    const client = this.database.client(tx);
    const claimed = await client.$executeRaw`
      INSERT INTO business_view_dedup
        (session_subject_hash, window_start, business_id, created_at)
      VALUES (${input.subjectHash}, ${input.windowStart},
        ${input.businessId}::uuid, statement_timestamp())
      ON CONFLICT DO NOTHING`;
    if (claimed !== 1) return false;
    await client.$executeRaw`
      INSERT INTO business_daily_views (business_id, ist_date, views)
      VALUES (${input.businessId}::uuid,
        (statement_timestamp() AT TIME ZONE 'Asia/Kolkata')::date, 1)
      ON CONFLICT (business_id, ist_date)
      DO UPDATE SET views = business_daily_views.views + 1`;
    return true;
  }

  async dailyViews(
    tx: TxContext,
    input: { businessId: string; fromIstDate: string; toIstDate: string },
  ): Promise<Map<string, number>> {
    const rows = await this.database
      .client(tx)
      .$queryRaw<{ date: string; views: number }[]>(
        Prisma.sql`SELECT to_char(ist_date, 'YYYY-MM-DD') AS date,
          views::float8 AS views
        FROM business_daily_views
        WHERE business_id = ${input.businessId}::uuid
          AND ist_date BETWEEN ${input.fromIstDate}::date
            AND ${input.toIstDate}::date`,
      );
    return new Map(rows.map((row) => [row.date, row.views]));
  }

  async coverageStartedAt(tx: TxContext): Promise<string | null> {
    const rows = await this.database
      .client(tx)
      .$queryRaw<{ startedAt: string }[]>(
        Prisma.sql`SELECT ${timestamp('started_at')} AS "startedAt"
        FROM business_reporting_coverage WHERE metric = 'profile_views'`,
      );
    return rows[0]?.startedAt ?? null;
  }

  deleteViewClaims(
    tx: TxContext,
    before: Date,
    limit: number,
  ): Promise<number> {
    return this.database.client(tx).$executeRaw`
      WITH expired AS (
        SELECT session_subject_hash, window_start, business_id
        FROM business_view_dedup
        WHERE created_at < ${before}
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      DELETE FROM business_view_dedup AS claim
      USING expired
      WHERE claim.session_subject_hash = expired.session_subject_hash
        AND claim.window_start = expired.window_start
        AND claim.business_id = expired.business_id`;
  }
}
