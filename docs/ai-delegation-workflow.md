# AI委譲ワークフロー — fishing-app

## 役割分担

| 担当 | 作業内容 |
|------|----------|
| Claude | アーキテクチャ設計、仕様策定、リスク判定、セキュリティ確認、差分レビュー、lint/build/audit確認、本番反映判断 |
| Ollama | ボイラープレート、CRUD、Reactコンポーネント scaffold、mockデータ、Tailwind UI、型定義初稿、既存パターンに沿ったページ追加、テスト/監査スクリプト初稿 |

## Spec形式（Ollamaへ渡す）

tmp/task-spec.md にこの形式で書く:

```
TASK: 何を作るかを1〜3行
FILES:
  - 変更: path/to/file.ts
  - 新規: path/to/new.ts
CONTEXT:
  既存の型・命名規則など最小限の情報のみ
RULES:
  - .env.localを触らない
  - secretを要求しない
  - 既存の型・命名規則に合わせる
  - isMock/dataSource区別を維持する
  - 釣果を断定しない
  - TCG/トレカ商品を混入させない
  - 不要な依存を追加しない
OUTPUT:
  - unified diff形式
  - 変更ファイル一覧
  - 注意点のみ
```

## 実行方法

```powershell
.\scripts\ollama-task.ps1 -Model qwen2.5-coder:7b -Spec .\tmp\task-spec.md
```

出力は `tmp/ollama-output.md` に保存される。

## Claudeのレビューチェックリスト

1. 既存設計に合っているか
2. 型が壊れていないか
3. mock/manual/api/generated の区別があるか
4. 釣果を断定していないか
5. 商品フィルタが効いているか（TCG除外）
6. secret/.env.localを触っていないか
7. lint/build/auditが通る見込みがあるか

問題あり → Ollamaへ再修正spec投入
問題なし → patch適用 → lint/build/audit → push

## 禁止事項

- Vercel/GitHub/Supabaseのsecretをチャットで要求しない
- .env.localをコミットしない
- DROP/DELETE/TRUNCATEを勝手に実行しない
- 未実装機能を実装済みとして表示しない
- mock商品を実商品として表示しない
- 釣果を保証する文言を書かない
- TCG/トレカ商品を釣具として表示しない

## タスク分解の例

悪い例: 「レポート機能を全部作って」

良い例:
- Step A: `lib/reports.ts` にReport型と6件のmanualデータだけ作る
- Step B: `app/reports/[slug]/page.tsx` の表示UIだけ作る
- Step C: `audit-content.ts` にレポート監査ルールだけ追加する

## Fallback順（コード下書き委譲）

1. **ローカル Ollama** `scripts/ollama-task.ps1 -Model qwen2.5:3b -TimeoutSec 90`
2. **Gemini** `scripts/external-llm-task.ps1 -Provider gemini -Model gemini-2.0-flash-lite`
3. **OpenRouter free** `scripts/external-llm-task.ps1 -Provider openrouter -Model google/gemma-3-12b:free`
4. **Groq** `scripts/external-llm-task.ps1 -Provider groq -Model llama3-8b-8192`
5. **Claude直接実装**（最終手段）

API keyは環境変数で管理（`GEMINI_API_KEY` / `OPENROUTER_API_KEY` / `GROQ_API_KEY`）。  
チャットでの要求禁止。specにsecret・本番DB情報・.env.local内容を含めない。

## 報告フォーマット

```
作業内容: 
Ollama委譲: あり / なし
変更ファイル: 
検証:
  lint: 
  build: 
  audit: 
残課題: 
次にやること: 
```
