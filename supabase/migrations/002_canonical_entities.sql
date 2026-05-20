-- 002_canonical_entities.sql
-- Canonical GEO entity foundation: regions, fish_species, regional_forecasts

create table if not exists regions (
  id text primary key,
  slug text unique not null,
  display_name text not null,
  prefecture text not null,
  latitude numeric,
  longitude numeric
);

create table if not exists fish_species (
  id text primary key,
  slug text unique not null,
  display_name text not null,
  category text not null
);

create table if not exists regional_forecasts (
  id uuid primary key default gen_random_uuid(),
  region_id text references regions(id),
  fish_id text references fish_species(id),
  forecast_date date,
  forecast_score int,
  weather_summary text,
  tide_summary text,
  sea_temperature numeric,
  ai_summary text,
  generated_at timestamptz default now()
);

create index if not exists idx_regional_forecasts_region_fish
  on regional_forecasts (region_id, fish_id);
create index if not exists idx_regional_forecasts_date
  on regional_forecasts (forecast_date desc);

-- Seed: regions
insert into regions (id, slug, display_name, prefecture, latitude, longitude) values
  ('tokyo_23',  'tokyo_23',  '東京23区', '東京都',  35.6764, 139.6500),
  ('hiroshima', 'hiroshima', '広島',     '広島県',  34.3853, 132.4553),
  ('yamaguchi', 'yamaguchi', '山口',     '山口県',  34.1859, 131.4714),
  ('okayama',   'okayama',   '岡山',     '岡山県',  34.6551, 133.9195)
on conflict (id) do nothing;

-- Seed: fish_species
insert into fish_species (id, slug, display_name, category) values
  ('seabass',   'seabass',   'シーバス',       'saltwater'),
  ('aji',       'aji',       'アジ',           'saltwater'),
  ('mebaru',    'mebaru',    'メバル',         'saltwater'),
  ('black_bass','black_bass','ブラックバス',   'freshwater')
on conflict (id) do nothing;
