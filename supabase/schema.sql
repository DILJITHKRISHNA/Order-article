-- Run this in the Supabase SQL Editor for your project.

create table if not exists submitted_order_items (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  customer_name text not null,
  shop_name text not null default '',
  executive_name text not null default '',
  location text not null,
  phone_number text not null,
  article text not null,
  color text not null,
  size text not null,
  qty integer not null check (qty > 0),
  sku text not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_submitted_order_items_submitted_at
  on submitted_order_items (submitted_at desc);

create index if not exists idx_submitted_order_items_order_number
  on submitted_order_items (order_number);

-- Prevent duplicate line items within the same order
create unique index if not exists idx_submitted_order_items_order_sku
  on submitted_order_items (order_number, sku);

-- If the table already exists, run this migration:
-- alter table submitted_order_items
--   add column if not exists shop_name text not null default '',
--   add column if not exists executive_name text not null default '';
-- create unique index if not exists idx_submitted_order_items_order_sku
--   on submitted_order_items (order_number, sku);
