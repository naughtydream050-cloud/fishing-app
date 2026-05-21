-- 005_forecast_metadata.sql
-- Add is_mock, data_source, valid_date columns to regional_forecasts (additive, non-destructive)

alter table regional_forecasts
  add column if not exists is_mock boolean default false,
  add column if not exists data_source text default 'jma-weather+lunar-tide-estimate+rule-score',
  add column if not exists valid_date date;
