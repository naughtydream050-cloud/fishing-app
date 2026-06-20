# Build Handoff - Oshi Activity Management

## Candidate Summary
推し活の現場予定、当落、入金、同行者メモを一画面で整理するローカルファーストのミニWebアプリ候補。

## Target User
- 複数の推し活予定をスマホで管理する人

## User Pain
- ライブ記録が写真アプリとメモに分かれる
- 推し活の予定と当落メモが散らばる
- 買ったグッズと未開封在庫を把握できない
- 遠征費と参戦記録がバラバラになる

## Old Way / Current Workaround
- カレンダー、メモ、スクショ、SNS DM、チケットサイトを行き来する。
- 支払い期限や同行者情報が、楽しい予定と別管理になる。

## MVP Solution
- 現場ごとに予定、当落、入金、同行者、メモを1枚のカードで管理する。
- まずはログインなし、ローカル保存、手入力で始める。

## Core Features
- 現場予定の一覧
- 当落ステータス管理
- 入金期限メモ
- 同行者メモ
- グッズ/遠征費の簡易メモ

## First Screen Idea
- 左: 現場カード一覧
- 右: 選択した現場の当落/入金/同行者/メモ編集
- 上部: 次の期限、未入金、当落待ちの小さなサマリー

## Data Model Draft
- event_id
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

## Note Article Angle
- なぜ推し活の予定と当落メモは、普通のカレンダーだけだと散らばるのか

## Threads Evidence
- 2026-06-05: 推し活管理 / quality=9 risk=2
- 2026-06-06: ライブ参戦記録 / quality=9 risk=2
- 2026-06-07: グッズ管理 / quality=9 risk=2
- 2026-06-08: 遠征費管理 / quality=9 risk=2

## Why This Should Be Built First
- 7日DRY_RUNのEditorial Reviewでkeep categoryの先頭。
- 推し活、ライブ記録、グッズ、遠征費の隣接カテゴリを束ねやすい。
- DB/Auth/paymentなしでもMVP価値を検証できる。

## Risks
- 実在サービスのチケット情報連携に踏み込むと規約/認証リスクが増える。
- 最初から通知や共有を入れると実装範囲が膨らむ。
- 完成品のように宣伝せず、仮説検証として扱う。

## Next Codex Build Prompt
See `NEXT_BUILD_PROMPT.md`.
