-- Explore HTML card parity: source-owned read projections only. No copied
-- contacts, stock or prices and no new manager/checkout write capability.
-- Forward recovery replaces views; no source rows are changed.
BEGIN;
CREATE VIEW businesses_public_contacts AS
  SELECT b.id AS business_id,b.whatsapp_e164 AS whatsapp_phone
  FROM businesses b JOIN businesses_public_context visible ON visible.id=b.id;

CREATE VIEW products_public_badges AS
  SELECT p.id AS product_id,
    CASE WHEN p.mrp_paise>p.price_paise AND p.mrp_paise>0
      THEN round((p.mrp_paise-p.price_paise)::numeric*100/p.mrp_paise)::integer
      ELSE NULL END AS discount_percent,
    CASE WHEN p.in_stock AND i.on_hand>0 AND i.on_hand<=i.low_stock_threshold
      THEN i.on_hand ELSE NULL END AS low_stock_quantity
  FROM products_public_discovery p LEFT JOIN inventory i ON i.product_id=p.id;
GRANT SELECT ON businesses_public_contacts,products_public_badges TO apnatown_runtime;
COMMIT;
