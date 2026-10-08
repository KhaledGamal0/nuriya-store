-- Numbers for scripts/sales-report.mjs (Cairo days). Output: one JSON document.
WITH bounds AS (
  SELECT (date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo') AS today,
         (date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo') - interval '6 days' AS week
),
o AS (SELECT o.* FROM orders o, bounds b WHERE o.created_at >= b.week AND o.status NOT IN ('CANCELLED', 'EXPIRED')),
i AS (SELECT i.*, o.created_at FROM order_items i JOIN o ON o.id = i.order_id)
SELECT json_build_object(
  'today', (SELECT json_build_object(
      'orders', count(*), 'pieces', coalesce((SELECT sum(qty) FROM i, bounds b WHERE i.created_at >= b.today), 0),
      'subtotal', coalesce(sum(subtotal_piasters), 0), 'delivery', coalesce(sum(shipping_piasters), 0), 'total', coalesce(sum(total_piasters), 0),
      'alt', count(alt_phone),
      'byHour', coalesce((SELECT json_agg(h ORDER BY h.hour) FROM (
          SELECT extract(hour FROM o2.created_at AT TIME ZONE 'Africa/Cairo')::int AS hour, count(*) AS orders
          FROM o o2, bounds b WHERE o2.created_at >= b.today GROUP BY 1) h), '[]'),
      'list', coalesce((SELECT json_agg(l ORDER BY l.time) FROM (
          SELECT to_char(o3.created_at AT TIME ZONE 'Africa/Cairo', 'HH24:MI') AS time, o3.number, o3.area_name AS area, o3.total_piasters AS total,
                 (SELECT string_agg(qty || '× ' || color_name || ' ' || size, ', ') FROM order_items x WHERE x.order_id = o3.id) AS items
          FROM o o3, bounds b WHERE o3.created_at >= b.today) l), '[]'))
    FROM o, bounds b WHERE o.created_at >= b.today),
  'week', (SELECT json_build_object(
      'orders', count(*), 'pieces', coalesce((SELECT sum(qty) FROM i), 0),
      'subtotal', coalesce(sum(subtotal_piasters), 0), 'delivery', coalesce(sum(shipping_piasters), 0), 'total', coalesce(sum(total_piasters), 0),
      'alt', count(alt_phone),
      'byItem', coalesce((SELECT json_agg(t ORDER BY t.qty DESC) FROM (SELECT color_name AS color, size, sum(qty) AS qty, sum(line_piasters) AS value FROM i GROUP BY 1, 2) t), '[]'),
      'byPrice', coalesce((SELECT json_agg(t ORDER BY t.unit) FROM (SELECT unit_piasters AS unit, sum(qty) AS qty FROM i GROUP BY 1) t), '[]'),
      'byArea', coalesce((SELECT json_agg(t ORDER BY t.orders DESC) FROM (SELECT area_name AS area, count(*) AS orders FROM o GROUP BY 1) t), '[]'),
      'byDay', coalesce((SELECT json_agg(t ORDER BY t.d DESC) FROM (
          SELECT (created_at AT TIME ZONE 'Africa/Cairo')::date AS d, to_char((created_at AT TIME ZONE 'Africa/Cairo')::date, 'Dy DD Mon') AS day,
                 count(*) AS orders, sum(total_piasters) AS total FROM o GROUP BY 1, 2) t), '[]'))
    FROM o),
  'stock', (SELECT coalesce(json_agg(s), '[]') FROM (
      SELECT c.name_en AS color, v.size, v.track_inventory AS tracked, (v.stock_on_hand - v.stock_reserved) AS available
      FROM variants v JOIN colorways c ON c.id = v.colorway_id WHERE v.is_active AND c.is_active ORDER BY c.position, v.size DESC) s)
);
