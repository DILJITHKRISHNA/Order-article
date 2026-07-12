-- Run this in the Supabase SQL Editor for your project.

create table if not exists submitted_order_items (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  customer_name text not null,
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
