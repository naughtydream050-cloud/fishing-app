# 本番環境セットアップ手順

## 必要な環境変数

### Vercel ダッシュボード（Settings → Environment Variables）

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | ✅ |
| `RAKUTEN_APP_ID` | 楽天 API | 任意 |
| `YAHOO_APP_ID` | Yahoo ショッピング API | 任意 |

### GitHub Secrets（Settings → Secrets and variables → Actions）

| シークレット名 | 用途 | 必須 |
|--------------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | forecast-cron.yml で使用 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | forecast-cron.yml 書き込み用 | ✅ |
| `VERCEL_REVALIDATE_URL` | ISR 再検証トリガー | 任意 |
| `VERCEL_REVALIDATE_TOKEN` | ISR 認証トークン | 任意 |

---

## Supabase セットアップ

### 1. マイグレーション実行

**既存 Supabase プロジェクト（推奨）**: Supabase ダッシュボード → SQL Editor で以下を順番に実行:

```
supabase/migrations/001_gear.sql
supabase/migrations/002_canonical_entities.sql
supabase/migrations/003_forecast_upsert_constraint.sql
supabase/migrations/004_pipeline_observability.sql
supabase/migrations/005_forecast_metadata.sql
```

**新規 Supabase プロジェクト（ゼロから構築）**: 上記の代わりに参照スキーマを使用:

```
supabase/migrations/006_regional_forecasts_schema_reference.sql
```
（この 1 ファイルで `regional_forecasts` の完全スキーマ + RLS を一括作成可能）

### 2. 初回データ投入

GitHub Secrets を設定後、GitHub Actions を手動実行:

1. GitHub リポジトリ → Actions タブ
2. "Daily Forecast Pipeline" を選択
3. "Run workflow" → "Run workflow" をクリック

または、ローカルで:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run generate:forecasts
```

---

## データソースの確認

- **黄バッジ（デモデータ）**: Supabase 未接続 or データなし
- **緑バッジ（実データ）**: Supabase から取得成功

mock fallback の優先順位:
1. `USE_MOCK_DATA=true` 環境変数
2. `NEXT_PUBLIC_SUPABASE_URL` が未設定 or placeholder
3. Supabase fetch エラー
4. テーブルにデータなし

---

## 定期実行（GitHub Actions）

`.github/workflows/forecast-cron.yml` が毎日 05:00 JST (20:00 UTC) に自動実行されます。

実行内容:
1. JMA 天気データ取得
2. 月齢ベース潮回り推定
3. 活性スコア計算
4. Supabase `regional_forecasts` テーブルへ upsert
5. Vercel ISR 再検証トリガー（`VERCEL_REVALIDATE_URL` 設定時）

---

## 免責事項

- 潮回りは月齢ベースの**簡易推定**です（`tide_summary` に「（簡易潮回り推定）」を付与）
- 釣れそう度は参考情報であり、釣果を保証するものではありません
- 実際の満潮・干潮時刻は各地の気象庁潮位表を確認してください
