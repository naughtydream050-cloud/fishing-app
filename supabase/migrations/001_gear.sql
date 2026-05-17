create table if not exists gear_prices (
  id uuid primary key default gen_random_uuid(),
  gear_name text not null,
  shop text not null check (shop in ('rakuten', 'yahoo')),
  price integer not null,
  url text not null,
  affiliate_url text not null,
  image_url text,
  shop_name text,
  fetched_at timestamptz default now(),
  unique (gear_name, shop, shop_name)
);

create index if not exists idx_gear_prices_name on gear_prices (gear_name);
create index if not exists idx_gear_prices_price on gear_prices (price);
