# Oshi Activity Management MVP Manual QA Checklist

Date: 2026-06-18

Status: Manual QA checklist. No live posting.

## Safety Preconditions

- [ ] Confirm `DRY_RUN=true`.
- [ ] Confirm `AUTO_POST=false`.
- [ ] Do not run Threads posting scripts.
- [ ] Do not add external APIs.
- [ ] Do not add DB/Auth/payment/RLS.
- [ ] Use only local browser testing and static files.

## 1. MVP Screen Checks

Open `web/oshi-activity-management/index.html` in a browser.

- [ ] Page title is `推し活ログボード`.
- [ ] Header shows `推し活ログボード`.
- [ ] Tabs are visible: ダッシュボード, ライブ参戦ログ, グッズ管理, 遠征費, メモ.
- [ ] Dashboard shows four metrics: ライブ件数, グッズ総額, 遠征費総額, 次の予定.
- [ ] Dashboard shows recent live and recent memo panels.
- [ ] ライブ参戦ログ list is visible and selectable.
- [ ] ライブ参戦ログ form includes: event_name, artist_or_group, date, venue, seat, ticket_status, companion, emotion_tag, setlist_note, cost, memo.
- [ ] グッズ管理 form includes: name, category, price, purchase_date, owned_count, memo.
- [ ] 遠征費 form includes: event_name, transport, hotel, food, goods, other, total.
- [ ] メモ form includes: title, date, body.
- [ ] Add, save, and delete buttons are visible on each editable screen.
- [ ] Export, Import, and Clear buttons are visible.

## 2. localStorage Checks

Use the browser devtools Application/Storage panel or reload behavior.

- [ ] Initial sample data appears on first load.
- [ ] `localStorage` contains `niche-app-signal-os:oshi-activity-management:v2` after first load.
- [ ] Creating a live log persists after reload.
- [ ] Editing `ticket_status` persists after reload.
- [ ] Editing `companion` persists after reload.
- [ ] Editing `emotion_tag` persists after reload.
- [ ] Deleting a record persists after reload.
- [ ] Clear empties the visible lists and persists after reload.
- [ ] JSON Export downloads data with the four top-level arrays: `lives`, `goods`, `travels`, `memos`.
- [ ] JSON Import restores valid exported data.
- [ ] Legacy v1 data, if present, is normalized into v2 fields without crashing.

## 3. Smartphone Display Checks

Check at roughly 390px wide and 844px high.

- [ ] Header text fits without overlap.
- [ ] Top buttons wrap or fit: Export, Import, Clear.
- [ ] Tabs are horizontally usable and not cut off.
- [ ] Dashboard metric cards stack cleanly.
- [ ] List and form stack vertically.
- [ ] Form labels remain readable.
- [ ] `ticket_status` select is usable.
- [ ] Save/delete buttons are reachable without horizontal scroll.
- [ ] Long Japanese text does not overflow card boundaries.
- [ ] No control is hidden behind viewport edges.

## 4. Japanese / Mojibake Checks

- [ ] No visible mojibake. If text looks like broken Japanese encoding, reject the screenshot and fix the source file before posting.
- [ ] Navigation text reads naturally in Japanese.
- [ ] Empty states read naturally in Japanese.
- [ ] Sample live data reads naturally in Japanese.
- [ ] Ticket status options read naturally: 未設定, 申込前, 申込済み, 当選, 落選, 入金済み, 発券済み.
- [ ] Button labels read naturally: 追加, 保存, 削除.
- [ ] Currency is displayed as yen.

## 5. 推し活ユーザー目線の違和感

Review as a user who attends live events and buys goods.

- [ ] The first screen explains value without needing a tutorial.
- [ ] `現場ごとに見返す` value is understandable from dashboard and live log.
- [ ] The MVP does not feel like a generic household budget app.
- [ ] Goods and travel costs feel connected to live attendance.
- [ ] `emotion_tag` feels optional and not forced.
- [ ] `companion` does not imply public sharing.
- [ ] `ticket_status` uses familiar language.
- [ ] The app does not overclaim reminders, sync, official ticket integration, or backup.
- [ ] The app feels like a prototype users can give feedback on.

## 6. Minimum Fixes Before Any Manual Post

- [ ] Capture one clean screenshot of the dashboard with no personal data.
- [ ] Confirm all visible Japanese is readable.
- [ ] Confirm the live log form shows `ticket_status`, `companion`, and `emotion_tag`.
- [ ] Confirm localStorage reload persistence.
- [ ] Confirm the first post says `試作版` and `ログインなし`.
- [ ] Confirm the first post does not imply cloud backup or official integrations.

## 7. Still-Do-Not-Post Actions

- [ ] Keep all copy as DRY_RUN until owner review.
- [ ] Do not call Threads API.
- [ ] Do not schedule automation.
- [ ] Do not enable `AUTO_POST`.
- [ ] Do not collect personal data.
- [ ] Do not add public feedback forms until separately approved.

## GPT Final Red Flags

Stop the manual post if any of these appear during QA:

1. 保存・編集・削除・import/exportのどれかでデータが壊れる。
2. スマホ表示で主要操作が分かりにくい、または押せない。
3. 投稿文やLP文が「管理・節約・効率化」寄りで、推し活の温度感を壊している。

GPT final decision: 追加実装は不要。完遂OK。
