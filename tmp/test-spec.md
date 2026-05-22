TASK:
  TypeScript関数を1つ作る。
  魚名を受け取って「〇〇が狙えます」という文字列を返す関数。

FILES:
  新規: lib/getFishLabel.ts

CONTEXT:
  - TypeScript
  - 引数: fishName: string
  - 戻り値: string

RULES:
  - 「釣れます」と断定しない（「狙えます」「期待できます」などを使う）
  - 10行以内
  - export default不要、named exportのみ

OUTPUT:
  - lib/getFishLabel.ts の全文（新規ファイルなので全文OK）
  - 注意点のみ
