# 釣りアプリ 自律運営設計

## 概要

本ドキュメントは、釣りアプリが「人間が毎回手作業で更新するサイト」ではなく、AI APIや定期処理を使って自律的に運営される釣り情報サービスになるための設計方針を示します。

---

## データソース分類

記事・釣果・釣具・スコアのデータは以下4種類のみ。混同禁止。

| ラベル | 意味 | UI表示 |
|--------|------|--------|
| `mock` | ハードコードのデモデータ（`lib/mock*.ts`） | 🔸 デモデータ |
| `api` | Rakuten/Yahoo/気象庁 等の外部API | 📡 実データ |
| `ai` | AI APIで生成（Claude等） | 🤖 AI生成（要審査） |
| `manual` | 運営者が手動で入力 | ✍️ 手動入力 |

**禁止事項:**
- mock データを実データのように表示しない
- AI生成コンテンツを人間レビュー済みのように見せない
- 釣果を断定しない（「釣れる」ではなく「釣れやすい傾向」）

---

## ContentJob ステートマシン

```
queued → generating → generated → reviewed → published
                          ↓           ↓
                        failed      rejected → queued
```

**不変条件:**
- `published` は `reviewed` を経由しないと到達不可能
- `runAiGenerationStub()` は `generated` まで遷移するが `published` には進めない
- 人間が `transitionJobStatus(job, 'reviewed')` を呼ぶまで公開不可

### JobType（生成ジョブの種類）

| type | 意味 |
|------|------|
| `generate_article_body` | 記事本文を生成 |
| `generate_related_spots` | 記事に関連釣り場を追加 |
| `add_gear_cta` | スポットに釣具CTAを追加 |
| `add_data_source_badge` | データソースラベルを設定 |
| `expand_article` | 記事全体を書き直し |

### 優先度

| priority | スコア範囲 | 意味 |
|----------|------------|------|
| 1（A） | < 40 | 最優先生成 |
| 2（B） | 40-69 | 優先 |
| 3（C） | ≥ 70 だが不合格 | 通常 |

---

## 釣具レコメンド方針

### カテゴリ多様化ルール

単品の安さだけで出さず、釣行目的別セットで表示する。

**必須スロット（diversifyGearCategories が保証）:**
1. ロッド（rod）× 1
2. リール（reel）× 1
3. 釣り方に応じた仕掛け（jighead/lure/worm/rig）× 1
4. ライフジャケット（safety）× 1

**補足アイテム（isPrimaryItem=false）:**
- 価格 < 500円の商品（40円の針・小物など）
- 補足として表示するが、主力CTAには使わない

**禁止:**
- 40円〜100円の小物のみで構成しない
- 同一カテゴリのみ並べない
- トレカ・ゲーム・カード類を含めない

### 釣り場→スタイル→必須カテゴリ マッピング

```
アジング/メバリング → rod, reel, jighead, worm, line
シーバスルアー      → rod, reel, lure, line
サビキ/エギング     → rod, reel, rig, line
バスルアー          → rod, reel, lure, worm
```

---

## 品質チェック方針

### 記事品質（100点満点）

| チェック | 減点 |
|---------|------|
| body なし | -30 |
| body < 200字 | -15 |
| body < 600字 | -10 |
| relatedSpotIds なし | -15 |
| プレースホルダー画像 | -10 |
| contentSource なし | -20 |
| body === summary | -5 |

合格ライン: 70点以上

### 釣り場品質（100点満点）

| チェック | 減点 |
|---------|------|
| dataSource なし | -30 |
| gearSetId なし | -20 |
| description < 50字 | -15 |
| tackle なし | -10 |
| difficulty なし | -5 |

---

## Cron スケジュール

```
0 15 * * *  →  15:00 UTC = 深夜0:00 JST (毎日)
```

**エンドポイント:** `/api/cron/daily-automation`

**認証:** `Authorization: Bearer <CRON_SECRET>` ヘッダー必須

**タスク順序:**
1. content_audit（コンテンツ品質監査）
2. stale_data_check（データ鮮度チェック）
3. gear_refresh（スキップ、ISR revalidation に委譲）
4. job_queue_process（ジョブキュー処理、最大3件）

---

## セキュリティ方針

- `CRON_SECRET` は Vercel 環境変数に設定。32文字以上のランダム文字列
- `ADMIN_SECRET` は Vercel 環境変数に設定。32文字以上のランダム文字列
- `.env.local` はコミット禁止
- APIキーやsecretをチャットログに出力しない
- cron エンドポイントはsecretをログに残さない

---

## 毎日更新するもの

- 釣り予報スコア（気象庁 + 月齢ベース）← 既存実装
- コンテンツ品質監査（`/api/cron/daily-automation` → `content_audit` タスク）
- データ鮮度チェック（Supabase接続時のみ）

## 毎週更新するもの

- AI生成記事のジョブキュー処理（`runWeeklyAutomation`）
- 釣具レコメンドの見直し（手動 or 将来自動化）

## AI APIで生成するもの（将来実装）

- 記事本文（`generate_article_body`）
- 関連釣り場リスト（`generate_related_spots`）
- 週次レポート（`weekly_report`）
- 釣り場ガイド（`spot_report`）

## 人間レビューが必要なもの

- AI生成コンテンツ全て（`generated` → `reviewed` の遷移は人間のみ）
- 釣果断定表現のチェック
- 商品リンクの適切性確認

## 自動公開してよいもの

- 気象庁APIの天気データ（DataSourceBadge付き）
- 楽天/Yahoo商品データ（最安値表示、免責文付き）
- 既存mock予報データ（デモデータバッジ付き）

---

## 今後必要なSupabaseテーブル

```sql
-- Phase 2: ジョブキューをDBに移行
CREATE TABLE content_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  priority INTEGER NOT NULL,
  quality_score INTEGER,
  quality_issues JSONB,
  generated_content TEXT,
  reviewed_by TEXT,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 3: AI生成記事の本番保存
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  content_source TEXT DEFAULT 'mock',
  status TEXT DEFAULT 'draft',
  related_spot_ids JSONB DEFAULT '[]',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 将来フェーズ

| フェーズ | 内容 |
|---------|------|
| Phase 1（現在） | インフラ整備。in-memoryキュー、AI stubのみ |
| Phase 2 | Supabase `content_jobs` テーブルに移行 |
| Phase 3 | 実際のAI API（Claude等）による記事生成 |
| Phase 4 | 自動レビュー補助（品質スコアが高いものを半自動化） |

---

## 禁止事項（再掲）

- APIキーやsecretをチャットに要求しない
- `.env.local` をコミットしない
- 実釣果でないものを実釣果として表示しない
- AI生成記事を人間レビュー済みのように見せない
- 商品を最安値順だけで出さない
- 40円小物だけをおすすめ表示しない
- トレカ/ゲーム/カード商品を表示しない
- 釣れると断定しない
- 本番DBを破壊しない
- 大規模なフレームワーク変更をしない
