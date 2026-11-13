-- Order notification templates (notifications BE matrix, orders rows; F-X-012).
-- In-app EN/HI v1 for the order producer events now consumed by the worker:
--   order.new       -> business owner on `order.created`
--   order.status    -> customer on business/handover progress and owner reject
--   order.cancelled -> business owner on customer cancellation
-- Params are the order number and a status code only (rendered through the
-- server vocabulary): never customer name, address, phone, amount or codes.
-- Email/WhatsApp rows are intentionally absent (no provider/approved template).
-- TODO(verify): Hindi copy pending content review.
-- Data-only and insert-only (ON CONFLICT DO NOTHING); recovery is forward
-- repair by a new version row. No schema or grant changes.
BEGIN;
INSERT INTO notification_templates (key,channel,locale,title,body,provider_template_id,version,active) VALUES
  ('order.new','in_app','en','New order','New order {orderNumber} received. Open it to accept or reject.',NULL,1,true),
  ('order.new','in_app','hi','नया ऑर्डर','नया ऑर्डर {orderNumber} मिला है। स्वीकार या अस्वीकार करने के लिए इसे खोलें।',NULL,1,true),
  ('order.status','in_app','en','Order update','Your order {orderNumber} is {status}.',NULL,1,true),
  ('order.status','in_app','hi','ऑर्डर अपडेट','आपके ऑर्डर {orderNumber} की स्थिति: {status}।',NULL,1,true),
  ('order.cancelled','in_app','en','Order cancelled','The customer cancelled order {orderNumber}.',NULL,1,true),
  ('order.cancelled','in_app','hi','ऑर्डर रद्द','ग्राहक ने ऑर्डर {orderNumber} रद्द कर दिया है।',NULL,1,true)
ON CONFLICT DO NOTHING;
COMMIT;
