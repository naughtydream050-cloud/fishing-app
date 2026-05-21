# fishing-app Claude Instructions

## 重要：作業方針

**プランモードを使わない。** `ExitPlanMode` を呼ばない。計画ファイルを作らない。
指示を受けたら直接実装を開始してください。

## プロジェクト概要
- Next.js 15 App Router
- Supabase（regional_forecastsテーブル）
- Vercel deploy（deploy-vercel.batまたはnpx vercel deploy --prod --yes）
- lint: `npm run lint`（= tsc --noEmit。ESLintなし）
- build: `npm run build`

## データ方針
- forecastRepository経由でSupabase優先 → mock fallback
- USE_MOCK_DATA=true の場合のみmock強制
- mockデータは必ず「デモデータ」と表示
- 潮汐は「簡易推定」として扱う

## 作業順（毎回この順で）
1. このファイルだけ読んでタスク開始（docs全文は読まない）
2. `rg` で対象ファイルを特定してから開く（最初に開くのは最大3ファイル）
3. 1タスク = 変更ファイル1〜3個まで
4. コード全文出力禁止。報告は差分要約のみ
5. Ollama委譲: `scripts/ollama-task.ps1 -TimeoutSec 90` を使う
6. timeoutしたらClaude直接実装に切り替える

## Ollama委譲ルール
- 委譲OK: mockデータ / 小型定義 / 小Reactコンポーネント / Tailwind / 記事下書き
- 委譲禁止: Supabase / Vercel / cron / secret / 認証 / 商品フィルタ最終判定 / deploy判断
- fallback順: qwen2.5:3b → 外部無料API（.env.local経由・secret送信禁止） → Claude直接実装

## 禁止事項
- .env.local をコミットしない
- DROP TABLEしない
- Vercel/GitHub/Supabase tokenをチャットで要求しない
- 不要なパッケージ追加しない
- 「釣れる」と断定しない
