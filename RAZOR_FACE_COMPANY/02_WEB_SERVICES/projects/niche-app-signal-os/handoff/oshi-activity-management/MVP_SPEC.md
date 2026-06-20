# MVP Spec - Oshi Activity Management

## MVP Scope
- ローカル保存の推し活予定管理Webアプリ。
- ログインなし、外部APIなし、手入力のみ。

## Non-Goals
- Threads自動投稿
- チケットサイト連携
- LINE通知
- 決済
- Auth/RLS/DB

## User Flow
1. 現場カードを追加する。
2. 公演日、会場、当落、入金期限を入力する。
3. 同行者、グッズ予算、遠征費、メモを追記する。
4. 次にやることを一覧で確認する。

## Screens
- Dashboard: 次の期限、当落待ち、未入金、総予算
- Event List: 現場カード一覧
- Event Detail: 入力フォームとメモ
- Export: JSON/CSVの簡易出力候補

## Fields
- title
- venue
- event_date
- lottery_status
- payment_status
- payment_due_date
- companion_name
- goods_budget
- travel_cost
- memo

## Validation Rules
- title is required
- event_date must be valid date when provided
- payment_due_date must be valid date when provided
- cost fields must be non-negative numbers

## Local-First Version
- localStorage or a single JSON file export/import.
- No server required for MVP.

## Future Path
- Paid: reminders, CSV export, multi-device sync.
- Note: build diary and problem framing.
- SaaS: only after repeated demand signals.
