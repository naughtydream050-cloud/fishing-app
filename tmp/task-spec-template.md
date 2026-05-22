# Task Spec Template

TASK:
  （何を作るか1〜3行で説明）

FILES:
  変更:
    - path/to/existing.ts
  新規:
    - path/to/new.ts

CONTEXT:
  （必要最小限の既存仕様のみ。長いコード全文は貼らない）
  例:
    - FishingReport型はlib/fishingReports.tsに定義済み
    - dataSourceは 'manual' | 'mock' | 'api' | 'generated'
    - isGenerated=true && reviewed=false はnotFound()

RULES:
  - .env.localを触らない
  - secretを要求しない
  - 既存の型・命名規則（camelCase）に合わせる
  - isMock/dataSource/reviewed の区別を維持する
  - 釣果を断定しない（「期待できます」など）
  - TCG/トレカ商品を釣具として表示しない
  - 不要なnpm依存を追加しない
  - コード全文ではなく差分(unified diff)で出力する

OUTPUT:
  - unified diff形式 (--- a/path +++ b/path)
  - 変更ファイル一覧
  - 注意点のみ（説明文は不要）
