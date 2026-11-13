-- Reference taxonomy seed for Catalog (F-HM-003/004, F-SV-008, Q-58 storage).
-- Source: final prototype `docs/design-context/reference/prototype-source/`:
--   product categories `CATS` and service categories `SCATS` (js1.js:12-17,
--   order, EN/HI names and icons), category slugs via `catSlug`/`slug`
--   (js21.js:2-3), service subcategories `SSUBS` (js21.js:5-11) and the
--   directed related-category maps `RELP`/`RELS` (js23.js:2-3), seeded as-is
--   without inferred reverse links.
-- Not seeded (no approved list): product subcategories, keyword mappings
-- (prototype `kw` is sample data only), Home sections and taxonomy images.
-- IDs are deterministic (md5 of a stable key) so later data migrations can
-- reference rows; inserts skip rows that already exist (ON CONFLICT DO NOTHING).
-- normalized_name mirrors the shared normalizeCatalogText + unaccent for
-- these ASCII names (lowercase, collapsed whitespace).
-- Recovery: transaction rollback on failure. Once in use, edit through the
-- audited super-admin API; deleting seeded rows breaks listings/services.
BEGIN;

INSERT INTO "categories" ("id", "kind", "slug", "name_en", "name_hi", "icon", "sort_order")
VALUES
    (md5('apnatown:catalog:category:grocery')::uuid, 'product', 'grocery', 'Grocery', 'किराना', '🛒', 0),
    (md5('apnatown:catalog:category:medical')::uuid, 'product', 'medical', 'Medical', 'दवाइयाँ', '💊', 1),
    (md5('apnatown:catalog:category:electronics')::uuid, 'product', 'electronics', 'Electronics', 'इलेक्ट्रॉनिक्स', '📺', 2),
    (md5('apnatown:catalog:category:mobile')::uuid, 'product', 'mobile', 'Mobile', 'मोबाइल', '📱', 3),
    (md5('apnatown:catalog:category:food')::uuid, 'product', 'food-sweets', 'Food & Sweets', 'खाना व मिठाई', '🍬', 4),
    (md5('apnatown:catalog:category:clothing')::uuid, 'product', 'clothing', 'Clothing', 'कपड़े', '👕', 5),
    (md5('apnatown:catalog:category:hardware')::uuid, 'product', 'hardware', 'Hardware', 'हार्डवेयर', '🔧', 6),
    (md5('apnatown:catalog:category:stationery')::uuid, 'product', 'stationery', 'Stationery', 'स्टेशनरी', '✏️', 7),
    (md5('apnatown:catalog:category:furniture')::uuid, 'product', 'furniture', 'Furniture', 'फर्नीचर', '🛋️', 8),
    (md5('apnatown:catalog:category:jewellery')::uuid, 'product', 'jewellery', 'Jewellery', 'ज्वेलरी', '💍', 9),
    (md5('apnatown:catalog:category:wedding')::uuid, 'service', 'wedding-events', 'Wedding & Events', 'शादी व इवेंट', '💒', 0),
    (md5('apnatown:catalog:category:builder')::uuid, 'service', 'home-builders', 'Home Builders', 'भवन निर्माण', '🏗️', 1),
    (md5('apnatown:catalog:category:mechanic')::uuid, 'service', 'mechanic-repair', 'Mechanic & Repair', 'मैकेनिक व रिपेयर', '🛠️', 2),
    (md5('apnatown:catalog:category:education')::uuid, 'service', 'coaching-education', 'Coaching & Education', 'कोचिंग व शिक्षा', '📚', 3),
    (md5('apnatown:catalog:category:electrician')::uuid, 'service', 'electrician', 'Electrician', 'इलेक्ट्रीशियन', '⚡', 4),
    (md5('apnatown:catalog:category:plumber')::uuid, 'service', 'plumber', 'Plumber', 'प्लंबर', '🚿', 5),
    (md5('apnatown:catalog:category:other')::uuid, 'service', 'other-services', 'Other Services', 'अन्य सेवाएँ', '➕', 6)
ON CONFLICT DO NOTHING;

INSERT INTO "subcategories" ("id", "category_id", "slug", "name_en", "name_hi", "normalized_name", "sort_order")
SELECT md5('apnatown:catalog:subcategory:' || s.category_key || ':' || s.slug)::uuid,
    md5('apnatown:catalog:category:' || s.category_key)::uuid,
    s.slug, s.name_en, s.name_hi,
    unaccent(regexp_replace(btrim(lower(s.name_en)), '\s+', ' ', 'g')), s.sort_order
FROM (VALUES
    ('wedding', 'tent-lighting', 'Tent & Lighting', 'टेंट व लाइटिंग', 0),
    ('wedding', 'dj-sound', 'DJ & Sound', 'डीजे व साउंड सिस्टम', 1),
    ('wedding', 'catering', 'Catering', 'खान-पान व केटरिंग सेवा', 2),
    ('wedding', 'photography-video', 'Photography & Video', 'फोटोग्राफी व वीडियोग्राफी', 3),
    ('wedding', 'decoration', 'Decoration', 'सजावट', 4),
    ('wedding', 'mehndi-makeup', 'Mehndi & Makeup', 'मेहंदी व मेकअप', 5),
    ('wedding', 'band-baraat', 'Band & Baraat', 'बैंड-बाजा व बारात', 6),
    ('wedding', 'invitation-cards', 'Invitation Cards', 'निमंत्रण कार्ड', 7),
    ('wedding', 'bridal-wear-rental', 'Bridal Wear Rental', 'दुल्हन के कपड़े किराये पर', 8),
    ('builder', 'mason', 'Mason', 'राजमिस्त्री', 0),
    ('builder', 'painter', 'Painter', 'पेंटर', 1),
    ('builder', 'plumber', 'Plumber', 'प्लंबर', 2),
    ('builder', 'electrician', 'Electrician', 'इलेक्ट्रीशियन', 3),
    ('mechanic', 'two-wheeler', 'Two-wheeler', 'दोपहिया वाहन', 0),
    ('mechanic', 'four-wheeler', 'Four-wheeler', 'चारपहिया वाहन', 1),
    ('mechanic', 'ac-repair', 'AC Repair', 'एसी रिपेयर', 2),
    ('mechanic', 'ac-installation', 'AC Installation', 'एसी इंस्टॉलेशन', 3),
    ('mechanic', 'mobile-repair', 'Mobile Repair', 'मोबाइल रिपेयर', 4),
    ('mechanic', 'appliance-repair', 'Appliance Repair', 'घरेलू उपकरण रिपेयर', 5),
    ('education', 'school-coaching', 'School Coaching', 'स्कूल कोचिंग', 0),
    ('education', 'spoken-english', 'Spoken English', 'स्पोकन इंग्लिश', 1),
    ('education', 'computer-classes', 'Computer Classes', 'कंप्यूटर क्लास', 2),
    ('electrician', 'house-wiring', 'House Wiring', 'घर की वायरिंग', 0),
    ('electrician', 'inverter-battery', 'Inverter & Battery', 'इन्वर्टर व बैटरी', 1),
    ('electrician', 'appliance-repair', 'Appliance Repair', 'उपकरणों की मरम्मत', 2),
    ('plumber', 'leakage-repair', 'Leakage Repair', 'लीकेज की मरम्मत', 0),
    ('plumber', 'bathroom-fitting', 'Bathroom Fitting', 'बाथरूम फ़िटिंग', 1),
    ('plumber', 'tank-cleaning', 'Tank Cleaning', 'टंकी की सफ़ाई', 2),
    ('other', 'general-services', 'General Services', 'सामान्य सेवाएँ', 0)
) AS s ("category_key", "slug", "name_en", "name_hi", "sort_order")
ON CONFLICT DO NOTHING;

INSERT INTO "category_relations" ("source_category_id", "related_category_id", "sort_order")
SELECT md5('apnatown:catalog:category:' || r.source_key)::uuid,
    md5('apnatown:catalog:category:' || r.related_key)::uuid, r.sort_order
FROM (VALUES
    ('electronics', 'electrician', 0),
    ('mobile', 'mechanic', 0),
    ('furniture', 'builder', 0),
    ('hardware', 'builder', 0),
    ('hardware', 'plumber', 1),
    ('food', 'wedding', 0),
    ('clothing', 'wedding', 0),
    ('jewellery', 'wedding', 0),
    ('stationery', 'education', 0),
    ('wedding', 'food', 0),
    ('wedding', 'clothing', 1),
    ('wedding', 'jewellery', 2),
    ('builder', 'hardware', 0),
    ('builder', 'furniture', 1),
    ('mechanic', 'mobile', 0),
    ('mechanic', 'electronics', 1),
    ('education', 'stationery', 0),
    ('electrician', 'electronics', 0),
    ('plumber', 'hardware', 0)
) AS r ("source_key", "related_key", "sort_order")
ON CONFLICT DO NOTHING;

-- Directed links must cross kinds (validated here because the CHECK cannot).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "category_relations" r
        JOIN "categories" s ON s."id" = r."source_category_id"
        JOIN "categories" t ON t."id" = r."related_category_id"
        WHERE s."kind" = t."kind"
    ) THEN
        RAISE EXCEPTION 'CATALOG_RELATION_KIND_INVALID';
    END IF;
END $$;

COMMIT;
