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
| `products` | `id uuid PK`; `business_id uuid NOT NULL FK businesses`; `category_id uuid NOT NULL FK categories`; `subcategory_id uuid NOT NULL FK subcategories`; `slug text NOT NULL UNIQUE` (generated once); `name_en text NOT NULL`; `name_hi text NULL`; `description text NULL`; `brand text NULL`; `sku text NULL`; `price_paise bigint NOT NULL CHECK >= 0`; `mrp_paise bigint NOT NULL CHECK >= price_paise`; `unit text NOT NULL`; `tags text[] NOT NULL DEFAULT '{}'`; `specs jsonb NOT NULL DEFAULT '[]'`; `featured boolean NOT NULL DEFAULT false`; `published boolean NOT NULL DEFAULT true`; `media jsonb NOT NULL DEFAULT '[]'` (ordered image references, schema below); `version int NOT NULL DEFAULT 1`; `deleted_at timestamptz NULL`; timestamps. Unique `(business_id,sku)` when SKU is not null. | Unique `slug` serves public route; `(business_id,created_at DESC,id DESC)` serves owner list; `(category_id,subcategory_id,created_at DESC,id DESC)` serves related-product queries; partial `(business_id,sku)` serves SKU lookup. |
| `product_variants` | `id uuid PK`; `product_id uuid NOT NULL FK products`; `label text NOT NULL`; `position int NOT NULL CHECK >= 0`; `UNIQUE(product_id,label)`, `UNIQUE(product_id,position)`. A variant is a selectable label; price and stock remain product-level pending Q-44. | `(product_id,position)` serves detail/editor order. |
| `inventory` | `product_id uuid PK FK products`; `on_hand int NOT NULL CHECK >= 0`; `low_stock_threshold int NOT NULL DEFAULT 5 CHECK >= 0`; `available_for_sale boolean NOT NULL DEFAULT true`; `version int NOT NULL DEFAULT 1`; `updated_at timestamptz NOT NULL`. Stock reaching zero prevents purchase even if the availability toggle is on. | `product_id` joins the product list and reservation path; `(available_for_sale,on_hand,product_id)` serves in/out-of-stock reads. |
| `product_category_pills` | `business_id uuid NOT NULL FK businesses`; `subcategory_id uuid NOT NULL FK subcategories`; `position int NOT NULL CHECK >= 0`; `label_en/label_hi text NULL` (null uses catalog label); `hidden boolean NOT NULL DEFAULT false`; PK `(business_id,subcategory_id)`; unique `(business_id,position)`. | PK serves profile pill settings; `(business_id,position)` serves customer profile order. |

`products.media` is a validated ordered array of image references with a per-item `showInGallery` flag. References are server-issued storage asset IDs; at most five image items are accepted, as shown in the prototype. The gallery flag defaults from `business_settings.gallery_media_default`. Product-linked YouTube/Instagram embeds, moderation, and their gallery/reels consent are owned by media-videos; its editor contract must validate allow-listed hosts, rebuild embeds server-side, and expose only approved content (BR-10). Product APIs never accept arbitrary embed URLs or alter video records. Exact photo file limits remain open under Q-46.

## Endpoints

| Method | Path | Auth, role, permission, scope | Request → response | Errors | Idempotent | Features / screens |
|---|---|---|---|---|---|---|
| GET | `/products/{slug}` | Public; only published, non-deleted product of an approved business | → localized product, inventory state, ordered image media and category breadcrumb IDs | `PRODUCT_NOT_FOUND` | Yes | F-PD-001–003, S-CUST-08 |
| GET | `/products/{slug}/related?cursor=&limit=` | Public; only published, non-deleted products of approved businesses | Same category and subcategory, excludes current product, purchasable items only; keyset cursor, limit ≤6 | `PRODUCT_NOT_FOUND`, `COMMON_VALIDATION_FAILED` | Yes | F-PD-008, S-CUST-08 |
| GET | `/businesses/me/products?query=&stock=&cursor=&limit=` | Authenticated approved vendor/provider; own business from session | Allow-listed query/stock filter, keyset cursor, limit ≤50 → product page | `PRODUCT_NOT_FOUND`, `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-004, F-PV-005 |
| POST | `/businesses/me/products` | Authenticated approved vendor/provider; own business from session | Allow-listed product fields, variant labels, ordered image asset IDs and gallery flags → product DTO | `PRODUCT_INVALID`, `PRODUCT_SKU_CONFLICT`, `USERS_APPROVAL_REQUIRED` | Idempotency key | F-VD-004, F-PV-005 |
| GET/PATCH/DELETE | `/businesses/me/products/{productId}` | Authenticated approved vendor/provider; own business only | GET product DTO; PATCH allow-listed fields + expected version; DELETE soft-deletes | `PRODUCT_NOT_FOUND`, `PRODUCT_NOT_OWNED`, `PRODUCT_INVALID`, `PRODUCT_VERSION_CONFLICT` | GET/DELETE yes; PATCH versioned | F-VD-004, F-PV-005, S-VEND-06/S-PROV-07 |
| PATCH | `/businesses/me/products/bulk` | Same owner and approval checks for every selected product | `{productIds[],action:"mark_in_stock"|"mark_out_of_stock"|"delete",expectedVersions[]}` → changed IDs; never partially applies | `PRODUCT_NOT_OWNED`, `PRODUCT_VERSION_CONFLICT`, `PRODUCT_BULK_INVALID` | Key + versions | F-VD-004, S-VEND-05 |
| POST | `/businesses/me/products/import` | Same owner and approval checks | CSV/XLSX file → imported count or row-numbered errors; invalid rows reject the whole transaction pending Q-47 | `PRODUCT_IMPORT_INVALID`, `PRODUCT_IMPORT_LIMIT`, `PRODUCT_SKU_CONFLICT` | Key + file hash | F-VD-004, S-VEND-05 |
| GET | `/businesses/me/inventory?cursor=&limit=` | Authenticated approved vendor/provider, own business only; provider uses product screens pending Q-45 | Keyset page of inventory DTOs | `COMMON_FORBIDDEN`, `COMMON_VALIDATION_FAILED` | Yes | F-VD-009, F-PV-005 |
| PATCH | `/businesses/me/inventory/{productId}` | Authenticated approved vendor/provider, own business only | `{delta?,availableForSale?,lowStockThreshold?,expectedVersion}` → inventory DTO; `delta` reaching zero marks unavailable; setting available when stock is zero sets it to 10 per Q-49 | `PRODUCT_NOT_FOUND`, `PRODUCT_NOT_OWNED`, `PRODUCT_STOCK_INVALID`, `PRODUCT_VERSION_CONFLICT` | Expected version | F-VD-009, F-PV-005 |
| POST | `/businesses/me/inventory/restock-low` | Same owner scope | `{targetOnHand:20,expectedVersions[]}` updates only products at/below their threshold; all-or-nothing | `PRODUCT_VERSION_CONFLICT`, `PRODUCT_BULK_INVALID` | Key + versions | F-VD-009, S-VEND-08 |
| GET/PUT | `/businesses/me/product-pills` | Authenticated approved vendor/provider, own business only | GET configured pills; PUT `{items:[{subcategoryId,position,labelEn?,labelHi?,hidden}]}` → saved ordered preferences | `PRODUCT_PILL_INVALID`, `PRODUCT_NOT_OWNED` | PUT is idempotent | F-VD-005, S-VEND-05 |

Prices and MRP are integer paise in API DTOs. Import converts valid decimal INR cells to paise without floating-point arithmetic. Customer bookmarks, offers, reviews, product-linked reels, seller details and cart mutations use their owning modules; this API does not duplicate those records or return their private data.

## Rules and use-cases

1. Resolve the product owner, role and business from the session; require approved business status (BR-06). Never trust a body-supplied owner ID.
2. Validate category/subcategory as an allowed matching catalog pair; do not create taxonomy from a product form. `name_en` is required; `name_hi` is optional as shown in the editor. Create product and inventory rows in one transaction using the new-product defaults below.
3. Enforce price ≥ 0, MRP ≥ price, nonnegative integer stock/threshold, unique business SKU, valid variant labels and optimistic `version`. A new product defaults to stock 10, threshold 5 and available; missing SKU is generated server-side with no public format contract.
4. Availability is purchasable only when published, not deleted, business approved, `available_for_sale=true`, and `on_hand>0`. Out-of-stock listings remain readable for the product detail state, but cannot be added to cart.
5. Cart-checkout uses the products application stock-reservation contract inside its checkout transaction. Reservation checks the selected product/variant, current on-hand count and quantity, then atomically decrements stock; BR-04 forbids oversell. Order cancellation/refund restoration is owned by orders.
6. Low-stock means `on_hand <= low_stock_threshold`; inventory edits use expected version. Restock-low sets qualifying rows to 20. The prototype's “Mark in stock” action sets zero stock to 10; preserve this pending confirmation under Q-49. Stock decrement to zero marks the item unavailable.
7. Generate an immutable slug at creation. Product image media preserves order; validate storage IDs, business ownership and per-item gallery choice. Media bytes are served through the storage port. Video links and approval remain with media-videos; only approved videos may render (BR-10).
8. Category-pill preferences affect only customer-facing product pills. Defaults derive from the business's active product subcategories; hidden/renamed/ordered values never change catalog taxonomy.

## Events and jobs

- Publish `product.created`, `product.updated`, `product.deleted`, `product.published`, `product.pills.updated`, and `inventory.changed` through the transactional outbox with product/business IDs and version only.
- Consumers: search invalidates product documents/facets; public-page cache revalidates the product/business tags; media-videos may read product media consent; notifications handles any approved back-in-stock behavior after Q-48.
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

## Acceptance criteria

1. Given an approved owner submits valid product details, when the product is saved, then the server stores paise amounts, an immutable slug, validated taxonomy and ordered media and returns an explicit DTO.
2. Given a caller changes a product owned by another business or lacks vendor/provider role, when the mutation is requested, then it is denied without exposing or changing the product.
3. Given invalid price/MRP, mismatched taxonomy, duplicate SKU, unknown field or stale version, when save is attempted, then a stable error is returned and no partial change persists.
4. Given two checkouts reserve the last unit concurrently, when both reservations run, then exactly one succeeds and stock never becomes negative.
5. Given an owner adjusts inventory, when the last unit is removed or a low-stock value is reached, then public availability and low-stock state reflect the committed inventory version.
6. Given an import contains an invalid row, when the file is submitted, then row-numbered errors are returned and no rows are imported under the all-or-nothing assumption for Q-47.
7. Given product image media is submitted, when the media list is saved, then only business-owned storage references are persisted and gallery consent is retained per item; product-linked videos remain media-videos-owned and only approved embeds render.
8. Given an owner configures product pills, when customer profile data is read, then only that business's visible, ordered, localized pills appear and taxonomy is unchanged.

## Tests

- Unit: paise parsing/validation, discount-independent price/MRP rules, variant membership, media allowlist/ownership, low-stock threshold, pill ordering, import row validation.
- Integration: owner CRUD, keyset filtering, soft delete, inventory version conflict, bulk all-or-nothing behavior, product read visibility and cache/outbox writes.
- Authorization negatives: customer mutation; vendor/provider wrong business; unapproved business; cross-business bulk IDs; stale version; no leakage from public unpublished/deleted slugs.
- Concurrency: simultaneous reservation of final unit and duplicate idempotent import request.
