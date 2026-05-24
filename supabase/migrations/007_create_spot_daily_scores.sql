-- ============================================================
-- 007_create_spot_daily_scores.sql
-- スポット別日次スコアテーブル
--
-- 目的: 固定釣りスポットを毎日自動評価し、スコアを保存する
-- 前提: spot_id は data/spots.ts の FishingSpot.id と対応
-- 適用: 本番DBへの適用は別途 Supabase MCP / SQL Editor で行う
--
-- 安全確認:
--   - DROP / DELETE / TRUNCATE を含まない
--   - CREATE TABLE IF NOT EXISTS で冪等
--   - 既存テーブルへの変更なし
-- ============================================================

-- ─── テーブル作成 ─────────────────────────────────────────

create table if not exists spot_daily_scores (
  id              uuid        primary key default gen_random_uuid(),

  -- スポット識別（data/spots.ts の FishingSpot.id と対応）
  spot_id         text        not null,
  prefecture      text        not null,   -- 絞り込み高速化用（非正規化）
  area            text        not null,   -- 同上

  -- 日付（JST の date 値。UTC変換は app側で行う）
  valid_date      date        not null,

  -- スコア
  score           int2        not null check (score >= 0 and score <= 100),
  rank            int2,                   -- 都道府県内ランク（null=未計算）

  -- 推奨情報
  target_fish     text        not null,   -- 最適魚種（日本語表示名）
  best_time_bands text[],                 -- 例: ['朝マズメ', '夕マズメ']

  -- サブスコア（各 0-100、null=計算対象外）
  weather_score   int2 check (weather_score   is null or (weather_score   >= 0 and weather_score   <= 100)),
  wind_score      int2 check (wind_score      is null or (wind_score      >= 0 and wind_score      <= 100)),
  tide_score      int2 check (tide_score      is null or (tide_score      >= 0 and tide_score      <= 100)),
  season_score    int2 check (season_score    is null or (season_score    >= 0 and season_score    <= 100)),
  safety_score    int2 check (safety_score    is null or (safety_score    >= 0 and safety_score    <= 100)),

  -- 表示テキスト
  reasons         text[],     -- 好条件の理由（例: ['大潮で潮通しよい', '南風3m/s 風耐性高']）
  cautions        text[],     -- 注意事項（例: ['駐車場混雑', '波やや高め']）

  -- データソース管理
  is_mock         boolean     not null default false,
  data_source     text        not null default 'jma+lunar-tide+rule-score',
                                        -- 'jma+lunar-tide+rule-score' | 'mock'
  generated_at    timestamptz not null default now(),

  -- 1スポット1日1レコード
  unique (spot_id, valid_date)
);

-- ─── コメント ─────────────────────────────────────────────

comment on table spot_daily_scores is
  'スポット別日次スコア。毎日cronで自動生成。valid_dateはJST日付。';

comment on column spot_daily_scores.spot_id is
  'data/spots.ts FishingSpot.id と対応（例: hiroshima-port）';
comment on column spot_daily_scores.rank is
  '都道府県内の当日スコア順位。スコア生成後に別途計算してupsert。';
comment on column spot_daily_scores.is_mock is
  'true = JMA API未接続時のルールベースフォールバック値';
comment on column spot_daily_scores.data_source is
  '使用データソースの識別子。UIのDataSourceBadge表示に利用。';

-- ─── インデックス ─────────────────────────────────────────

-- フロントのランキングページ用（valid_date + prefecture でスコア降順）
create index if not exists idx_spot_daily_scores_date_pref_score
  on spot_daily_scores (valid_date, prefecture, score desc);

-- スポット詳細ページ用（spot_id の時系列参照）
create index if not exists idx_spot_daily_scores_spot_date
  on spot_daily_scores (spot_id, valid_date desc);

-- エリア絞り込み用
create index if not exists idx_spot_daily_scores_pref_area_date
  on spot_daily_scores (prefecture, area, valid_date desc);

-- ─── RLS ─────────────────────────────────────────────────

alter table spot_daily_scores enable row level security;

-- 匿名ユーザー含む全員が読める（SELECT のみ）
create policy "spot_daily_scores: public read"
  on spot_daily_scores
  for select
  using (true);

-- INSERT / UPDATE / DELETE は public 不可
-- service_role は RLS をバイパスするため追加ポリシー不要

-- ─── 検証用クエリ（適用後に手動で確認する） ─────────────────
-- select count(*) from spot_daily_scores;
-- select spot_id, valid_date, score, rank from spot_daily_scores order by valid_date desc limit 10;
