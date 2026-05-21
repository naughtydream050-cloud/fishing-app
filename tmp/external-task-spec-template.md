TASK:
  （何を作るか1〜2行）

FILES:
  新規: path/to/new.ts
  変更: path/to/existing.ts

CONTEXT:
  （既存の型名・関数名など最小限のみ。コード全文は貼らない）

RULES:
  - .env.localを触らない / secretを要求しない
  - 既存の型・命名規則に合わせる
  - 釣果を断定しない
  - TCG/トレカ商品を混入させない
  - 不要なnpm依存を追加しない

OUTPUT:
  - 新規ファイルは全文 / 変更は unified diff形式
  - 注意点のみ（説明不要）
