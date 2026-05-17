-- 004_pipeline_observability.sql
-- AI summary cache + pipeline run tracking

create table if not exists ai_summary_cache (
  forecast_hash text primary key,
  summary       text not null,
  region_id     text not null,
  fish_id       text not null,
  generated_at  timestamptz not null default now()
);

create index if not exists idx_summary_cache_region_fish
  on ai_summary_cache (region_id, fish_id);

create table if not exists pipeline_runs (
  id                uuid primary key default gen_random_uuid(),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  regions_processed int default 0,
  generation_count  int default 0,
  skipped_count     int default 0,
  failures          int default 0,
  llm_duration_ms   int default 0,
  status            text default 'running'
);

create index if not exists idx_pipeline_runs_started
  on pipeline_runs (started_at desc);
