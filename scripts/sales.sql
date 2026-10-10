-- Numbers for scripts/sales-report.mjs, in Cairo days. Output: one JSON document.
-- Run with:  psql -v mode=daily|weekly|monthly -f sales.sql
--   daily   = yesterday (full day)            compared with the day before
--   weekly  = the last 7 full days            compared with the 7 days before
--   monthly = last calendar month             compared with the month before
-- Cancelled and expired orders are left out. No customer names or phones.
WITH t AS (SELECT date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AS today, date_trunc('month', now() AT TIME ZONE 'Africa/Cairo') AS month),
p AS (
  SELECT CASE :'mode' WHEN 'monthly' THEN month - interval '1 month' WHEN 'weekly' THEN today - interval '7 days' ELSE today - interval '1 day' END AS cs,
         CASE :'mode' WHEN 'monthly' THEN month WHEN 'weekly' THEN today ELSE today END AS ce,
         CASE :'mode' WHEN 'monthly' THEN month - interval '2 months' WHEN 'weekly' THEN today - interval '14 days' ELSE today - interval '2 days' END AS ps,
         CASE :'mode' WHEN 'monthly' THEN month - interval '1 month' WHEN 'weekly' THEN today - interval '7 days' ELSE today - interval '1 day' END AS pe
  FROM t
),
-- Bounds as real timestamps (Cairo wall time → instant).
b AS (SELECT cs AT TIME ZONE 'Africa/Cairo' AS cs, ce AT TIME ZONE 'Africa/Cairo' AS ce, ps AT TIME ZONE 'Africa/Cairo' AS ps, pe AT TIME ZONE 'Africa/Cairo' AS pe,
             cs AS cs_local, ce - interval '1 day' AS ce_local FROM p),
ok AS (SELECT * FROM orders WHERE status NOT IN ('CANCELLED', 'EXPIRED')),
o AS (SELECT ok.* FROM ok, b WHERE ok.created_at >= b.cs AND ok.created_at < b.ce),
po AS (SELECT ok.* FROM ok, b WHERE ok.created_at >= b.ps AND ok.created_at < b.pe),
i AS (SELECT i.* FROM order_items i JOIN o ON o.id = i.order_id),
pi AS (SELECT i.* FROM order_items i JOIN po ON po.id = i.order_id)
SELECT json_build_object(
  'mode', :'mode',
  'from', (SELECT to_char(cs_local, 'Dy DD Mon YYYY') FROM b),
  'to', (SELECT to_char(ce_local, 'Dy DD Mon YYYY') FROM b),
  'month', (SELECT to_char(cs_local, 'FMMonth YYYY') FROM b),
  'cur', (SELECT json_build_object(
      'orders', count(*), 'pieces', coalesce((SELECT sum(qty) FROM i), 0),
      'subtotal', coalesce(sum(subtotal_piasters), 0), 'delivery', coalesce(sum(shipping_piasters), 0), 'total', coalesce(sum(total_piasters), 0),
      'alt', count(alt_phone)) FROM o),
  'prev', (SELECT json_build_object(
      'orders', count(*), 'pieces', coalesce((SELECT sum(qty) FROM pi), 0), 'total', coalesce(sum(total_piasters), 0)) FROM po),
  'byItem', coalesce((SELECT json_agg(x ORDER BY x.qty DESC, x.color, x.size) FROM (SELECT color_name AS color, size, sum(qty) AS qty, sum(line_piasters) AS value FROM i GROUP BY 1, 2) x), '[]'),
  'byPrice', coalesce((SELECT json_agg(x ORDER BY x.unit) FROM (SELECT unit_piasters AS unit, sum(qty) AS qty FROM i GROUP BY 1) x), '[]'),
  'byArea', coalesce((SELECT json_agg(x ORDER BY x.orders DESC, x.area) FROM (SELECT area_name AS area, count(*) AS orders, sum(total_piasters) AS total FROM o GROUP BY 1) x), '[]'),
  'byDay', coalesce((SELECT json_agg(x ORDER BY x.d) FROM (
      SELECT (created_at AT TIME ZONE 'Africa/Cairo')::date AS d, to_char((created_at AT TIME ZONE 'Africa/Cairo')::date, 'Dy DD Mon') AS day,
             count(*) AS orders, sum(total_piasters) AS total FROM o GROUP BY 1, 2) x), '[]'),
  'byHour', coalesce((SELECT json_agg(x ORDER BY x.hour) FROM (
      SELECT extract(hour FROM created_at AT TIME ZONE 'Africa/Cairo')::int AS hour, count(*) AS orders FROM o GROUP BY 1) x), '[]'),
  'list', coalesce((SELECT json_agg(x ORDER BY x.at) FROM (
      SELECT o.created_at AS at, to_char(o.created_at AT TIME ZONE 'Africa/Cairo', 'Dy HH24:MI') AS time, o.number, o.area_name AS area, o.total_piasters AS total, o.status,
             (SELECT string_agg(qty || '× ' || color_name || ' ' || size, ', ') FROM order_items y WHERE y.order_id = o.id) AS items
      FROM o) x), '[]'),
  'waiting', (SELECT json_build_object('count', count(*), 'numbers', coalesce(json_agg(number ORDER BY created_at), '[]'))
      FROM orders WHERE status = 'CONFIRMATION_NEEDED'),
  'allTime', (SELECT json_build_object('orders', count(*), 'total', coalesce(sum(total_piasters), 0)) FROM ok),
  'stock', (SELECT coalesce(json_agg(s), '[]') FROM (
      SELECT c.name_en AS color, v.size, v.track_inventory AS tracked, (v.stock_on_hand - v.stock_reserved) AS available
      FROM variants v JOIN colorways c ON c.id = v.colorway_id WHERE v.is_active AND c.is_active ORDER BY c.position, v.size DESC) s)
);
