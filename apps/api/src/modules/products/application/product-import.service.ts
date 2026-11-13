import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  PRODUCT_IMPORT_HEADERS,
  PRODUCT_IMPORT_MAX_BYTES,
  PRODUCT_IMPORT_MAX_ROWS,
  ProductImportResultSchema,
  type ProductImportPolicyResult,
  type ProductImportResult,
} from '@apnatown/shared/products';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  SETTINGS_READ,
  type SettingsReadPort,
} from '../../settings/application/settings-ports';
import {
  ProductOwnerAccess,
  type ProductOwnerCommand,
  type ProductOwnerRequest,
} from './product-owner-access';
import {
  PRODUCT_IMPORT_READER,
  PRODUCT_IMPORT_REPOSITORY,
  type ProductImportReader,
  type ProductImportRepository,
} from './product-import-ports';
import { ImportRowErrors, importColumns } from './product-import-errors';
import {
  importRow,
  markDuplicateSkus,
  type ImportRowInput,
} from './product-import-rows';
import { newProductFields, newProductStock, slugBase } from './product-rules';
import { ProductWriteSupport } from './product-write-support';

const OPERATION = {
  name: 'products.owner.import',
  method: 'POST',
  resource: '/businesses/me/products/import',
  successStatus: 200,
} as const;

/**
 * Owner CSV/XLSX product import (Q-47): bounded by the configured
 * `product_import` caps (never above the shared ceilings), validated in full
 * before any write, then committed all-or-nothing in one transaction through
 * the create rules (same owner/approval check, defaults, generated SKU/slug,
 * one ID-only `product.created` event per product). No media/variants/specs.
 */
@Injectable()
export class ProductImportService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(PRODUCT_IMPORT_READER) private readonly reader: ProductImportReader,
    @Inject(PRODUCT_IMPORT_REPOSITORY)
    private readonly products: ProductImportRepository,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly support: ProductWriteSupport,
    private readonly access: ProductOwnerAccess,
  ) {}

  /** Effective caps for an approved owner; null caps while disabled. */
  policy(request: ProductOwnerRequest): Promise<ProductImportPolicyResult> {
    return this.uow.run(async (tx) => {
      await this.access.resolve(tx, request, {
        denial: 'USERS_APPROVAL_REQUIRED',
      });
      const caps = await this.caps(tx);
      return {
        enabled: caps !== null,
        maxRows: caps?.maxRows ?? null,
        maxBytes: caps?.maxBytes ?? null,
        headers: [...PRODUCT_IMPORT_HEADERS],
      };
    });
  }

  async import(
    request: ProductOwnerCommand,
    bytes: Buffer,
  ): Promise<ProductImportResult> {
    const caps = await this.uow.run(async (tx) => {
      await this.access.resolve(tx, request, {
        denial: 'USERS_APPROVAL_REQUIRED',
      });
      return this.caps(tx);
    });
    if (!caps) throw new DomainError('PRODUCT_IMPORT_POLICY_REQUIRED');
    if (bytes.length > caps.maxBytes)
      throw new DomainError('PRODUCT_IMPORT_LIMIT', { field: 'file' });
    // Same key + different file bytes → COMMON_CONFLICT (request hash).
    const digest = createHash('sha256').update(bytes).digest('hex');
    const command = this.support.command(request, OPERATION, { digest });
    // File-local parse only (deterministic for the hashed bytes); taxonomy
    // and SKU rules run after the receipt claim so a same-key retry replays.
    const { rows, errors } = this.parse(bytes, caps.maxRows);
    return this.commands.run(
      command,
      async (tx) => {
        const business = await this.access.resolve(tx, request, {
          lock: true,
          denial: 'USERS_APPROVAL_REQUIRED',
        });
        await this.assertRules(tx, business.id, rows, errors);
        const at = this.clock.now();
        const planned = rows.map(({ input }) => {
          const id = this.ids.uuidv7();
          return { id, fields: newProductFields(input, id, []), input };
        });
        const slugs = await this.products.allocateSlugs(
          tx,
          planned.map(({ fields }) => slugBase(fields.nameEn)),
        );
        const inserted = await this.products.insertMany(
          tx,
          planned.map(({ id, fields, input }, index) => {
            const slug = slugs[index];
            if (slug === undefined) throw new Error('SLUG_ALLOCATION_MISMATCH');
            const stock = newProductStock(input.inventory);
            return { ...fields, id, businessId: business.id, slug, stock, at };
          }),
        );
        if (!inserted) throw new DomainError('PRODUCT_SKU_CONFLICT');
        const productIds = planned.map(({ id }) => id);
        await this.support.emitCreated(
          tx,
          request.correlationId,
          business.id,
          productIds,
        );
        const result: ProductImportResult = {
          importedCount: productIds.length,
          productIds,
        };
        return result as ProductImportResult & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            ProductImportResultSchema.parse(stored) as ProductImportResult &
              JsonValue,
          ),
      },
    );
  }

  /** Configured, enabled caps clamped to the shared ceilings; else null. */
  private async caps(tx: TxContext) {
    const setting = await this.settings.get('product_import', tx);
    if (!setting?.value.enabled) return null;
    return {
      maxRows: Math.min(setting.value.maxRows, PRODUCT_IMPORT_MAX_ROWS),
      maxBytes: Math.min(setting.value.maxBytes, PRODUCT_IMPORT_MAX_BYTES),
    };
  }

  /** File-local rules (headers, rows, duplicate SKUs); errors are collected. */
  private parse(
    bytes: Buffer,
    maxRows: number,
  ): { rows: ImportRowInput[]; errors: ImportRowErrors } {
    const sheet = this.reader.read(bytes, { maxRows });
    const columns = importColumns(sheet.headers);
    if (!sheet.rows.length)
      throw new DomainError('PRODUCT_IMPORT_INVALID', { field: 'rows' });
    const errors = new ImportRowErrors();
    const rows = sheet.rows.flatMap(
      (row) => importRow(row, columns, errors) ?? [],
    );
    markDuplicateSkus(rows, errors);
    return { rows, errors };
  }

  /**
   * Taxonomy (still active and paired) and SKU (still free) rules inside the
   * business-locked transaction, reported together with the file-local
   * errors before any write. The taxonomy read takes no row lock.
   */
  private async assertRules(
    tx: TxContext,
    businessId: string,
    rows: readonly ImportRowInput[],
    errors: ImportRowErrors,
  ): Promise<void> {
    await this.taxonomyErrors(rows, errors, tx);
    await this.skuConflicts(tx, businessId, rows, errors);
    if (errors.size) throw errors.fail();
  }

  /** Active product category + matching active subcategory per row. */
  private async taxonomyErrors(
    rows: readonly ImportRowInput[],
    errors: ImportRowErrors,
    tx?: TxContext,
  ): Promise<void> {
    const taxonomy = await this.support.productTaxonomy(
      [...new Set(rows.map(({ input }) => input.categoryId))],
      [...new Set(rows.map(({ input }) => input.subcategoryId))],
      tx,
    );
    for (const { row, input } of rows)
      if (!taxonomy.categories.has(input.categoryId))
        errors.add(row, 'categoryId', 'unknown_category');
      else if (
        taxonomy.subcategories.get(input.subcategoryId) !== input.categoryId
      )
        errors.add(row, 'subcategoryId', 'subcategory_mismatch');
  }

  private async skuConflicts(
    tx: TxContext,
    businessId: string,
    rows: readonly ImportRowInput[],
    errors: ImportRowErrors,
  ): Promise<void> {
    const skus = rows.flatMap(({ input }) => (input.sku ? [input.sku] : []));
    const taken = new Set(
      await this.products.existingSkus(tx, businessId, skus),
    );
    for (const { row, input } of rows)
      if (input.sku && taken.has(input.sku))
        errors.add(row, 'sku', 'sku_conflict');
  }
}
