# BE: products

## Contents

- [Responsibility](#responsibility)
- [Tables](#tables)
- [Endpoints](#endpoints)
- [Rules and use-cases](#rules-and-use-cases)
- [Events and jobs](#events-and-jobs)
- [Errors](#errors)
- [Acceptance criteria](#acceptance-criteria)
- [Tests](#tests)

Features: F-PD-001, F-PD-002, F-PD-003, F-PD-006, F-PD-008, F-PD-009, F-VD-004, F-VD-005, F-VD-009, F-PV-005 (product listing only) | Rules: BR-01, BR-02, BR-04, BR-06, BR-16 | State machines: none | Depends on: businesses, catalog | Used by: cart-checkout, search, offers, orders, reviews, engagement, media-videos, admin

Frontend counterpart: [FE products](../fe/products.md) · [Feature inventory](../../../docs/FEATURE_INVENTORY.md)

## Responsibility

Own product listing content, variants, stock, owner inventory controls, ordered product images, and product-category pill preferences. Vendors and approved providers manage only their own products; businesses owns business identity, catalog owns taxonomy, and other modules retain their offer, review, bookmark, video, and order data.

## Tables

| Table | Columns, constraints and defaults | Indexes |
|---|---|---|
| `products` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `category_id uuid NOT NULL FK categories`; `subcategory_id uuid NOT NULL FK subcategories`; `slug text NOT NULL UNIQUE` (generated once); `name_en text NOT NULL`; `name_hi text NULL`; `description text NULL`; `brand text NULL`; `sku text NULL`; `price_paise bigint NOT NULL CHECK >= 0`; `mrp_paise bigint NOT NULL CHECK >= price_paise`; `unit text NOT NULL`; `tags text[] NOT NULL DEFAULT '{}'`; `specs jsonb NOT NULL DEFAULT '[]'`; `featured_selected boolean NOT NULL DEFAULT false`; `published boolean NOT NULL DEFAULT true`; `media jsonb NOT NULL DEFAULT '[]'` (ordered image references, schema below); `version int NOT NULL DEFAULT 1`; `deleted_at timestamptz NULL`; timestamps. Unique `(business_id,sku)` when SKU is not null. | Unique `slug` serves public route; `(business_id,created_at DESC,id DESC)` serves owner list; `(category_id,subcategory_id,created_at DESC,id DESC)` serves related-product queries; partial `(category_id,featured_selected DESC,created_at DESC,id DESC) WHERE published AND deleted_at IS NULL` supports default featured-first Explore; partial `(business_id,sku)` serves SKU lookup. |
| `product_variants` | `id uuid PK`; `product_id uuid NOT NULL FK products`; `label text NOT NULL`; `position int NOT NULL CHECK >= 0`; `active boolean NOT NULL DEFAULT true`. Partial UNIQUE `(product_id,label)` and `(product_id,position)` for active rows. A variant is a selectable label; price and stock remain product-level pending Q-44. Referenced variants are deactivated, not hard-deleted. | `(product_id,active,position)` serves detail/editor order. |
| `inventory` | `product_id uuid PK FK products`; `on_hand int NOT NULL CHECK >= 0`; `low_stock_threshold int NOT NULL DEFAULT 5 CHECK >= 0`; `available_for_sale boolean NOT NULL DEFAULT true`; `version int NOT NULL DEFAULT 1`; `updated_at timestamptz NOT NULL`. Stock reaching zero prevents purchase even if the availability toggle is on. | `product_id` joins the product list and reservation path; `(available_for_sale,on_hand,product_id)` serves in/out-of-stock reads. |
| `product_category_pills` | `business_id uuid NOT NULL FK businesses`; `subcategory_id uuid NOT NULL FK subcategories`; `position int NOT NULL CHECK >= 0`; `label_en/label_hi text NULL` (null uses catalog label); `hidden boolean NOT NULL DEFAULT false`; PK `(business_id,subcategory_id)`; unique `(business_id,position)`. | PK serves profile pill settings; `(business_id,position)` serves customer profile order. |

`products.media` is a validated ordered array of image references with a per-item `showInGallery` flag. References are server-issued storage asset IDs; at most five image items are accepted, using Media's public-image limits. The gallery flag defaults from `business_settings.gallery_media_default`. Product-linked YouTube/Instagram embeds, moderation, and their gallery/reels consent remain Media-owned; Product APIs never accept arbitrary embed URLs or alter video records (BR-10).

The [Media public-image policy](../../media-videos/be/media-videos.md#public-image-policy) resolves Q-46. Add nullable `products.tax_code text`; validate through `SettingsTaxPort`, never accept arbitrary rates/tax amounts. Missing fiscal configuration permits discovery but `ProductReadPort.forCheckout` returns not-orderable with a reason. Quote projection includes `{taxCode,taxConfigurationVersion}` and frozen fiscal data. Imports without classification remain non-orderable until completed; no inferred HSN/rate. `pricePaise` remains tax-inclusive. Public DTOs expose orderability, not supplier verification evidence.

`featured_selected` records the owner's selection, not public eligibility. `ProductReadPort` returns `featured` only when item/business visibility and Payments' current Premium entitlement permit it. Migration renames the prior `featured` flag to `featured_selected`; selections without entitlement fail closed using the resolved Payments billing policy.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/products/{slug}` | Public; only published, non-deleted product of an approved business | → localized product, inventory state, ordered image media and category breadcrumb IDs | `PRODUCT_NOT_FOUND` | Yes | F-PD-001–003, S-CUST-08 |
| GET | `/businesses/public/{slug}/products?subcategory=&cursor=&limit=` | Public; approved business and public products | → `{items,nextCursor,pills:[{subcategoryId,slug,labelEn,labelHi,count,position}]}`; optional subcategory slug; limit ≤50 | `PRODUCT_NOT_FOUND`, `COMMON_VALIDATION_FAILED` | Yes | F-PF-004, S-CUST-06/07 |
| GET | `/products/{slug}/related?cursor=&limit=` | Public; only published, non-deleted products of approved businesses | Same category and subcategory, excludes current product, purchasable items only; keyset cursor, limit ≤6 | `PRODUCT_NOT_FOUND`, `COMMON_VALIDATION_FAILED` | Yes | F-PD-008, S-CUST-08 |
| GET | `/businesses/me/products?query=&stock=&cursor=&limit=` | Authenticated approved vendor/provider; own business from session | Allow-listed query/stock filter, keyset cursor, limit ≤50 → product page | `PRODUCT_NOT_FOUND`, `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-004, F-PV-005 |
| POST | `/businesses/me/products` | Authenticated approved vendor/provider; own business from session | Allow-listed product fields including `featuredSelected?`, variant labels, ordered image asset IDs and gallery flags → product DTO; selection requires active Premium feature entitlement | `PRODUCT_INVALID`, `PRODUCT_SKU_CONFLICT`, `FEATURED_ENTITLEMENT_UNAVAILABLE`, `USERS_APPROVAL_REQUIRED` | Idempotency key | F-VD-004, F-PV-005 |
| GET/PATCH/DELETE | `/businesses/me/products/{productId}` | Authenticated approved vendor/provider; own business only | GET product DTO; PATCH allow-listed fields including `featuredSelected?` + expected version; DELETE soft-deletes; selection requires active Premium feature entitlement | `PRODUCT_NOT_FOUND`, `PRODUCT_NOT_OWNED`, `PRODUCT_INVALID`, `FEATURED_ENTITLEMENT_UNAVAILABLE`, `PRODUCT_VERSION_CONFLICT` | GET/DELETE yes; PATCH versioned | F-VD-004, F-PV-005, S-VEND-06/S-PROV-07 |
| PATCH | `/businesses/me/products/bulk` | Same owner and approval checks for every selected product | `{productIds[],action:"mark_in_stock"\|"mark_out_of_stock"\|"delete",expectedVersions[]}` → changed IDs; never partially applies | `PRODUCT_NOT_OWNED`, `PRODUCT_VERSION_CONFLICT`, `PRODUCT_BULK_INVALID` | Key + versions | F-VD-004, S-VEND-05 |
| POST | `/businesses/me/products/import` | Same owner and approval checks | CSV/XLSX file → imported count or row-numbered errors; invalid rows reject the whole transaction pending Q-47 | `PRODUCT_IMPORT_INVALID`, `PRODUCT_IMPORT_LIMIT`, `PRODUCT_SKU_CONFLICT` | Key + file hash | F-VD-004, S-VEND-05 |
| GET | `/businesses/me/inventory?cursor=&limit=` | Authenticated approved vendor/provider, own business only; provider uses product screens pending Q-45 | Keyset page of inventory DTOs | `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-009, F-PV-005 |
| PATCH | `/businesses/me/inventory/{productId}` | Authenticated approved vendor/provider, own business only | `{delta?,availableForSale?,lowStockThreshold?,expectedVersion}` → inventory DTO; `delta` reaching zero marks unavailable; setting available when stock is zero sets it to 10 per Q-49 | `PRODUCT_NOT_FOUND`, `PRODUCT_NOT_OWNED`, `PRODUCT_STOCK_INVALID`, `PRODUCT_VERSION_CONFLICT` | Expected version | F-VD-009, F-PV-005 |
| POST | `/businesses/me/inventory/restock-low` | Same owner scope | `{targetOnHand:20,expectedVersions[]}` updates only products at/below their threshold; all-or-nothing | `PRODUCT_VERSION_CONFLICT`, `PRODUCT_BULK_INVALID` | Key + versions | F-VD-009, S-VEND-08 |
| GET/PUT | `/businesses/me/product-pills` | Authenticated approved vendor/provider, own business only | GET configured pills; PUT `{items:[{subcategoryId,position,labelEn?,labelHi?,hidden}]}` → saved ordered preferences | `PRODUCT_PILL_INVALID`, `PRODUCT_NOT_OWNED` | PUT is idempotent | F-VD-005, S-VEND-05 |
| Internal | `listForAdmin` / `setPublishedByAdmin` | Called only by `admin` listings after `catalog:view`/`catalog:edit` + business area scope | List a business's products; `{productId,published,reasonKey,expectedVersion}` unpublishes/republishes, audit before/after, owner notified | `PRODUCT_NOT_FOUND`, `PRODUCT_VERSION_CONFLICT` | Yes | F-AD-003 |

Prices and MRP are integer paise in API DTOs. Import converts valid decimal INR cells to paise without floating-point arithmetic. Customer bookmarks, offers, reviews, product-linked reels, seller details and cart mutations use their owning modules; this API does not duplicate those records or return their private data.

### DTOs and internal reads

- Product writes allow only `{nameEn,nameHi?,description?,categoryId,subcategoryId,brand?,sku?,pricePaise,mrpPaise,taxCode?,unit,tags?,specs?:[{label,value}],featuredSelected?,published?,variants?:[{id?,label}],media?:[{assetId,showInGallery}],inventory?:{onHand?,lowStockThreshold?,availableForSale?,expectedVersion?},expectedVersion?}`. PATCH is partial with required product version; inventory changes also require its current version and commit with the product edit. An existing variant ID must belong to this product; omitted active variants are deactivated. `taxCode` is an allow-listed classification, never a client tax rate.
- `ProductReadPort.publicProjection({productIds?,businessIds?,categoryIds?,subcategoryIds?,cursor,limit})` exposes `{id,businessId,slug,nameEn,nameHi,categoryId,subcategoryId,brand,pricePaise,mrpPaise,unit,featured,media,variants,inventory:{onHand,availableForSale,lowStockThreshold,version},version}` for public eligible rows only. Search obtains effective offers and ratings from their owners; this projection is not a second offers/reviews store.
- `ProductReadPort.ownerSummary({businessId,actor}) -> {totalProducts,inStock,outOfStock,lowStockCount,lowStockItems,nextCursor}` uses the same inventory predicates as the manager and supplies the business overview. `ProductAdminReadPort.listForBusiness` implements the exact scoped [Admin DTO](../../admin/be/admin.md#required-owning-module-ports), including unpublished items only after catalog:view and owner-area authorization.
- Export the same public eligibility/pricing/stock columns as an owner-maintained read-only SQL projection for Search to compose before filtering/counting/keyset limiting. Never export private owner inventory-edit DTOs directly as customer cards or duplicate a financial/review rule in Search.
- Implement `ProductMediaReadPort.resolve` using [Media's bounded projection](../../media-videos/be/media-videos.md#required-discoverycommerce-read-ports). Return current publication, asset attachment and per-item Gallery flags from Products; no resolved URLs or recursive Media lookup.
- Public pills count visible public products before the selected-pill filter, omit hidden pills, preserve configured order/labels and use Catalog defaults when no preference exists. Return zero-count selected pills explicitly rather than silently changing the filter. Out-of-stock products remain public; the related-products endpoint alone requires purchasability.
- Import schema is the same product allow-list with exact template headers `nameEn,nameHi,categoryId,subcategoryId,brand,sku,priceINR,mrpINR,unit,onHand,lowStockThreshold,availableForSale,tags`. IDs must reference existing permitted taxonomy; comma-separated tags are parsed as text, not formulas. Media/variants/structured specs use the editor rather than undocumented CSV object syntax. Reject unknown headers, duplicate SKU rows, formulas and invalid decimal INR; no imported row may set owner/status/audit fields. Q-47 caps must be configured before enabling import.
- `ProductsStockPort.reserve({reservationId,lines:[{orderItemId,productId,variantId,quantity,expectedStockVersion}]},uow) -> {stocks:[{productId,version,onHand}]}` is called only by Orders after claiming its stock operation in the placement UoW; `reservationId=checkoutAttemptId`. Lock inventory in stable product-ID order, aggregate variant-labelled lines by product, validate live purchasability/versions and decrement once per product.
- `ProductsStockPort.release({releaseId,reservationId,lines:[{orderItemId,productId,quantity}]},uow)` returns the same stocks shape. Orders owns `order_stock_allocations`/`order_stock_operations`, proves the release is within the outstanding reservation and commits ledger, mutation and result together; replay returns that recorded result without calling Products again. Products never queries foreign ledger tables. Referenced inactive variants/soft-deleted products remain releasable; restocking cannot republish them or override an owner's availability toggle.

## Rules and use-cases

1. Resolve the product owner, role and business from the session; require approved business status (BR-06). Never trust a body-supplied owner ID.
2. Validate category/subcategory as an allowed matching catalog pair; do not create taxonomy from a product form. `name_en` is required; `name_hi` is optional as shown in the editor. Create product and inventory rows in one transaction using the new-product defaults below.
3. Enforce price ≥ 0, MRP ≥ price, nonnegative integer stock/threshold, unique business SKU, valid variant labels and optimistic `version`. A new product defaults to stock 10, threshold 5 and available; missing SKU is generated server-side with no public format contract.
4. Availability is purchasable only when published, not deleted, business approved, `available_for_sale=true`, and `on_hand>0`. Out-of-stock listings remain readable for the product detail state, but cannot be added to cart.
5. Orders invokes the stock ports above in the shared placement transaction, never at quote time or directly from Cart. Validate `{productId,variantId:null|uuid,quantity}`: no active variants requires null; a nonempty variant set requires an active member. Different variant labels cannot each reserve the same final unit. Cancellation/partial fulfilment releases only the recorded reserved quantity; a monetary refund alone does not prove stock was returned.
6. Low-stock means `on_hand <= low_stock_threshold`; inventory edits use expected version. Restock-low sets qualifying rows to 20. The prototype's “Mark in stock” action sets zero stock to 10; preserve this pending confirmation under Q-49. Stock decrement to zero marks the item unavailable.
7. Generate an immutable slug at creation. Product image media preserves order; validate storage IDs, business ownership and per-item gallery choice. Media bytes are served through the storage port. Video links and approval remain with media-videos; only approved videos may render (BR-10).
8. Category-pill preferences affect only customer-facing product pills. Defaults derive from the business's active product subcategories; hidden/renamed/ordered values never change catalog taxonomy.
9. Variant removal or price/stock changes invalidate stale quotes; fulfilled order item snapshots retain the original label/amount. Media IDs must be ready, business-owned, image-purpose assets from Media's registry; a guessed private/KYC asset ID is not a public product image.
10. Public `featured` is derived from `featured_selected`, approved/published visibility, and Payments' current Premium entitlement at `at`; it is never a freely writable public flag. Unavailable entitlement blocks new selections. Effective status immediately becomes false on listing/business ineligibility or entitlement expiry, while the stored owner selection is retained. A verified renewal restores effective featuring for still-selected, otherwise-eligible products without a product write.

## Events and jobs

- Publish `product.created`, `product.updated`, `product.deleted`, `product.published`, `product.pills.updated`, and `inventory.changed` through the transactional outbox with product/business IDs and version only. A change to `featured_selected` is included in `product.updated`.
- Consumers: search invalidates product documents/facets; public-page cache revalidates the product/business/featured tags; media-videos may read product media consent; notifications handles any approved back-in-stock behavior after Q-48. Payments' `business.subscription.eligibility_changed` and `business.subscription.expired` invalidate effective featured status without requiring product writes.
- Product writes and inventory reservation are synchronous transactions; bounded CSV imports are synchronous and atomic. No product-specific scheduled job is defined.

## Errors

| Code | HTTP | Message key |
|---|---:|---|
| `PRODUCT_NOT_FOUND` | 404 | `errors.products.notFound` |
| `PRODUCT_NOT_OWNED` | 403 | `errors.products.notOwned` |
| `PRODUCT_INVALID` | 422 | `errors.products.invalid` |
| `PRODUCT_STOCK_INVALID` | 422 | `errors.products.stockInvalid` |
| `PRODUCT_VERSION_CONFLICT` | 409 | `errors.products.versionConflict` |
| `PRODUCT_SKU_CONFLICT` | 409 | `errors.products.skuConflict` |
| `PRODUCT_BULK_INVALID` | 422 | `errors.products.bulkInvalid` |
| `PRODUCT_IMPORT_INVALID` | 422 | `errors.products.importInvalid` |
| `PRODUCT_IMPORT_LIMIT` | 413 | `errors.products.importLimit` |
| `PRODUCT_PILL_INVALID` | 422 | `errors.products.pillInvalid` |
| `FEATURED_ENTITLEMENT_UNAVAILABLE` | 409 | `errors.products.featuredEntitlementUnavailable` |

## Acceptance criteria

1. Given an approved owner submits valid product details, when the product is saved, then the server stores paise amounts, an immutable slug, validated taxonomy and ordered media and returns an explicit DTO.
2. Given a caller changes a product owned by another business or lacks vendor/provider role, when the mutation is requested, then it is denied without exposing or changing the product.
3. Given invalid price/MRP, mismatched taxonomy, duplicate SKU, unknown field or stale version, when save is attempted, then a stable error is returned and no partial change persists.
4. Given two checkouts reserve the last unit concurrently, when both reservations run, then exactly one succeeds and stock never becomes negative.
   Given a release is replayed, exceeds its outstanding allocation, or references a now-inactive historical variant, then replay adds no stock, excess fails atomically, and a valid historical release restores only its recorded quantity without enabling the listing.
5. Given an owner adjusts inventory, when the last unit is removed or a low-stock value is reached, then public availability and low-stock state reflect the committed inventory version.
6. Given an import contains an invalid row, when the file is submitted, then row-numbered errors are returned and no rows are imported under the all-or-nothing assumption for Q-47.
7. Given product image media is submitted, when the media list is saved, then only business-owned storage references are persisted and gallery consent is retained per item; product-linked videos remain media-videos-owned and only approved embeds render.
8. Given an owner configures product pills, when customer profile data is read, then only that business's visible, ordered, localized pills appear and taxonomy is unchanged.
9. Given a product has no variants, when added/purchased with `variantId:null`, then no fictitious variant is required; with variants, a missing/foreign/inactive ID is rejected.
10. Given two lines use different variants of one product, when they reserve the final unit concurrently, then their combined quantity is checked against one inventory row and cannot oversell.
11. Given a stale inventory version or a repeated cancellation release, when processed, then stock is neither overwritten nor restored twice.
12. Given an owner selects a product for featuring without active Premium entitlement, when saved, then the write is rejected and no featured state is exposed; given entitlement expires, then its public projection is immediately non-featured while the owner selection remains stored; after a verified renewal, the still-eligible selected product becomes featured again without a product write.

## Tests

- Unit: paise parsing/validation, discount-independent price/MRP rules, variant membership, media allowlist/ownership, low-stock threshold, pill ordering, import row validation.
- Integration: owner CRUD, keyset filtering, soft delete, inventory version conflict, bulk all-or-nothing behavior, product read visibility and cache/outbox writes.
- Authorization negatives: customer mutation; vendor/provider wrong business; unapproved business; cross-business bulk IDs; stale version; no leakage from public unpublished/deleted slugs.
- Concurrency: simultaneous reservation of final unit and duplicate idempotent import request.
