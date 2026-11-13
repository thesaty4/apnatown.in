-- Delivery dispatch notification templates (notifications BE matrix,
-- delivery rows; F-RD-003, F-VD-008). In-app EN/HI v1:
--   delivery.offer      -> rider on `delivery.offer_created` (link /rider/requests)
--   delivery.assigned   -> business owner on `delivery.assigned`
--   delivery.unassigned -> business owner on `delivery.unassigned` (no rider available)
-- Params are the order number only: never customer name, address, phone,
-- amount, code or location. Customer progress keeps `order.status`.
-- Email/WhatsApp rows are intentionally absent (no provider/approved template).
-- TODO(verify): Hindi copy pending content review.
-- Data-only and insert-only (ON CONFLICT DO NOTHING); recovery is forward
-- repair by a new version row. No schema or grant changes.
BEGIN;
INSERT INTO notification_templates (key,channel,locale,title,body,provider_template_id,version,active) VALUES
  ('delivery.offer','in_app','en','New delivery request','A new delivery request is waiting. Accept it within 60 seconds.',NULL,1,true),
  ('delivery.offer','in_app','hi','नया डिलीवरी अनुरोध','एक नया डिलीवरी अनुरोध आया है। 60 सेकंड के अंदर स्वीकार करें।',NULL,1,true),
  ('delivery.assigned','in_app','en','Rider assigned','A rider accepted order {orderNumber} and is on the way to your shop.',NULL,1,true),
  ('delivery.assigned','in_app','hi','राइडर तय हुआ','एक राइडर ने ऑर्डर {orderNumber} स्वीकार किया है और आपकी दुकान की ओर आ रहा है।',NULL,1,true),
  ('delivery.unassigned','in_app','en','No rider available','No rider is available for order {orderNumber} right now. Request again or assign a rider.',NULL,1,true),
  ('delivery.unassigned','in_app','hi','कोई राइडर उपलब्ध नहीं','ऑर्डर {orderNumber} के लिए अभी कोई राइडर उपलब्ध नहीं है। फिर से अनुरोध करें या राइडर चुनें।',NULL,1,true)
ON CONFLICT DO NOTHING;
COMMIT;
