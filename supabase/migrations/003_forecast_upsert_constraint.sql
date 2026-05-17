-- 003_forecast_upsert_constraint.sql
-- Add unique constraint on (region_id, fish_id, forecast_date) for upsert support

alter table regional_forecasts
  drop constraint if exists regional_forecasts_region_fish_date_key;

alter table regional_forecasts
  add constraint regional_forecasts_region_fish_date_key
  unique (region_id, fish_id, forecast_date);
