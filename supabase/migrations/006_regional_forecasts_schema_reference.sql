-- 006_regional_forecasts_schema_reference.sql
-- 完全スキーマ参照（002〜005のマイグレーション適用済みの最終形）
-- 非破壊: テーブルが存在しない場合のみ作成
-- 本番DBには002〜005を順番に適用すること。新規環境ではこのファイル単体でも可。

CREATE TABLE IF NOT EXISTS regional_forecasts (
  id               uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id        text      NOT NULL,
  fish_id          text      NOT NULL,
  forecast_date    date      NOT NULL DEFAULT current_date,
  forecast_score   integer   NOT NULL,
  weather_summary  text,
  tide_summary     text,
  sea_temperature  numeric(4,1),
  ai_summary       text,
  is_mock          boolean   NOT NULL DEFAULT false,
  data_source      text      NOT NULL DEFAULT 'jma-weather+lunar-tide-estimate+rule-score',
  generated_at     timestamptz NOT NULL DEFAULT now(),
  valid_date       date      NOT NULL DEFAULT current_date,
  UNIQUE(region_id, fish_id, forecast_date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_rf_region_id     ON regional_forecasts(region_id);
CREATE INDEX IF NOT EXISTS idx_rf_forecast_date ON regional_forecasts(forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_rf_generated_at  ON regional_forecasts(generated_at DESC);

-- RLS: 読み取りは anon 可、書き込みは service_role
ALTER TABLE regional_forecasts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'regional_forecasts' AND policyname = 'public read'
  ) THEN
    CREATE POLICY "public read" ON regional_forecasts FOR SELECT USING (true);
  END IF;
END $$;
