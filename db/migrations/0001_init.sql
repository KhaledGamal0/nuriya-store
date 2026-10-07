-- Nuriya store: initial schema.
-- Money is integer piasters (1 EGP = 100). Customer-facing text has _en and _ar columns.
-- Statuses use CHECK constraints so bad values can never be stored.

-- ---------- Catalog ----------
CREATE TABLE products (
  id              serial PRIMARY KEY,
  slug            text NOT NULL UNIQUE,
  name_en         text NOT NULL,
  name_ar         text NOT NULL DEFAULT '',
  type_en         text NOT NULL,
  type_ar         text NOT NULL DEFAULT '',
  summary_en      text NOT NULL,
  summary_ar      text NOT NULL DEFAULT '',
  details_en      jsonb NOT NULL DEFAULT '[]',
  details_ar      jsonb NOT NULL DEFAULT '[]',
  fabric_en       text,
  fabric_ar       text,
  care_en         text,
  care_ar         text,
  price_piasters  integer NOT NULL CHECK (price_piasters > 0),
  status          text NOT NULL DEFAULT 'live' CHECK (status IN ('draft', 'live', 'archived')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE colorways (
  id          serial PRIMARY KEY,
  product_id  integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code        text NOT NULL,
  name_en     text NOT NULL,
  name_ar     text NOT NULL DEFAULT '',
  swatch_hex  text NOT NULL CHECK (swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  detail_en   text NOT NULL DEFAULT '',
  detail_ar   text NOT NULL DEFAULT '',
  position    integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  UNIQUE (product_id, code)
);

CREATE TABLE variants (
  id                     serial PRIMARY KEY,
  colorway_id            integer NOT NULL REFERENCES colorways(id) ON DELETE CASCADE,
  size                   text NOT NULL CHECK (size IN ('S/M', 'L/XL')),
  sku                    text NOT NULL UNIQUE,
  price_override_piasters integer CHECK (price_override_piasters IS NULL OR price_override_piasters > 0),
  -- Until Khaled gives stock counts, track_inventory stays false and every size is available.
  track_inventory        boolean NOT NULL DEFAULT false,
  stock_on_hand          integer NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
  stock_reserved         integer NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
  is_active              boolean NOT NULL DEFAULT true,
  UNIQUE (colorway_id, size),
  CHECK (stock_reserved <= stock_on_hand OR NOT track_inventory)
);

CREATE TABLE media (
  id           serial PRIMARY KEY,
  colorway_id  integer NOT NULL REFERENCES colorways(id) ON DELETE CASCADE,
  src          text NOT NULL,
  alt_en       text NOT NULL,
  alt_ar       text NOT NULL DEFAULT '',
  width        integer NOT NULL CHECK (width > 0),
  height       integer NOT NULL CHECK (height > 0),
  kind         text NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'model', 'detail', 'styled', 'flat')),
  position     integer NOT NULL DEFAULT 0
);
CREATE INDEX media_colorway_idx ON media (colorway_id, position);

CREATE TABLE size_chart (
  id             serial PRIMARY KEY,
  product_id     integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size           text NOT NULL CHECK (size IN ('S/M', 'L/XL')),
  shoulder_cm    integer NOT NULL,
  chest_cm       integer NOT NULL,
  length_cm      integer NOT NULL,
  weight_min_kg  integer NOT NULL,
  weight_max_kg  integer NOT NULL CHECK (weight_max_kg >= weight_min_kg),
  UNIQUE (product_id, size)
);

-- ---------- Delivery ----------
CREATE TABLE shipping_zones (
  id            serial PRIMARY KEY,
  code          text NOT NULL UNIQUE,
  label_en      text NOT NULL,
  label_ar      text NOT NULL DEFAULT '',
  fee_piasters  integer NOT NULL CHECK (fee_piasters >= 0),
  cod_allowed   boolean NOT NULL DEFAULT true,
  is_active     boolean NOT NULL DEFAULT true,
  position      integer NOT NULL DEFAULT 0
);

CREATE TABLE shipping_areas (
  id         serial PRIMARY KEY,
  zone_id    integer NOT NULL REFERENCES shipping_zones(id) ON DELETE RESTRICT,
  slug       text NOT NULL UNIQUE,
  name_en    text NOT NULL,
  name_ar    text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true
);

-- ---------- Customers and orders ----------
CREATE TABLE customers (
  id             serial PRIMARY KEY,
  phone          text NOT NULL UNIQUE CHECK (phone ~ '^01[0125][0-9]{8}$'),
  name           text NOT NULL,
  refused_count  integer NOT NULL DEFAULT 0,
  is_blocked     boolean NOT NULL DEFAULT false,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id                 bigserial PRIMARY KEY,
  number             text NOT NULL UNIQUE,
  customer_id        integer NOT NULL REFERENCES customers(id),
  status             text NOT NULL CHECK (status IN (
                       'PENDING_PAYMENT', 'CONFIRMATION_NEEDED', 'CONFIRMED', 'PACKED',
                       'WITH_COURIER', 'DELIVERED', 'REFUSED_AT_DOOR', 'CANCELLED', 'EXPIRED')),
  payment_method     text NOT NULL CHECK (payment_method IN ('cod', 'card')),
  payment_status     text NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'FAILED', 'REFUNDED')),
  area_id            integer NOT NULL REFERENCES shipping_areas(id),
  address            text NOT NULL,
  subtotal_piasters  integer NOT NULL CHECK (subtotal_piasters >= 0),
  shipping_piasters  integer NOT NULL CHECK (shipping_piasters >= 0),
  discount_piasters  integer NOT NULL DEFAULT 0 CHECK (discount_piasters >= 0),
  total_piasters     integer NOT NULL,
  tracking_number    text,
  note               text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (total_piasters = subtotal_piasters + shipping_piasters - discount_piasters)
);
CREATE INDEX orders_status_idx ON orders (status, created_at DESC);
CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE TABLE order_items (
  id             bigserial PRIMARY KEY,
  order_id       bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id     integer NOT NULL REFERENCES variants(id),
  product_name   text NOT NULL,
  color_name     text NOT NULL,
  size           text NOT NULL,
  unit_piasters  integer NOT NULL CHECK (unit_piasters > 0),
  qty            integer NOT NULL CHECK (qty BETWEEN 1 AND 5),
  line_piasters  integer NOT NULL,
  CHECK (line_piasters = unit_piasters * qty)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);

CREATE TABLE payments (
  id               bigserial PRIMARY KEY,
  order_id         bigint NOT NULL REFERENCES orders(id),
  provider         text NOT NULL CHECK (provider IN ('paymob')),
  provider_ref     text NOT NULL,
  amount_piasters  integer NOT NULL,
  currency         text NOT NULL DEFAULT 'EGP',
  status           text NOT NULL,
  hmac_verified    boolean NOT NULL DEFAULT false,
  raw              jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);

CREATE TABLE order_events (
  id          bigserial PRIMARY KEY,
  order_id    bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type        text NOT NULL,
  data        jsonb NOT NULL DEFAULT '{}',
  actor       text NOT NULL DEFAULT 'system',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events (order_id, created_at);

-- ---------- Marketing, content, audit ----------
CREATE TABLE discount_codes (
  id                  serial PRIMARY KEY,
  code                text NOT NULL UNIQUE,
  kind                text NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value               integer NOT NULL CHECK (value > 0),
  min_subtotal        integer NOT NULL DEFAULT 0,
  max_uses            integer,
  used_count          integer NOT NULL DEFAULT 0,
  per_customer_limit  integer NOT NULL DEFAULT 1,
  starts_at           timestamptz,
  ends_at             timestamptz,
  is_active           boolean NOT NULL DEFAULT true,
  CHECK (kind <> 'percent' OR value <= 100)
);

CREATE TABLE content_blocks (
  key         text PRIMARY KEY,
  value_en    text NOT NULL,
  value_ar    text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  actor       text NOT NULL,
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON audit_log (entity, entity_id, created_at DESC);
