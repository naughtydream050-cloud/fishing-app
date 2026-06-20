# 推し活ログボード MVP

`handoff/oshi-activity-management/` を元にした local-first Web MVP です。Niche App Signal OS 本体の DRY_RUN 投稿パイプラインとは分離された静的アプリです。

## Run

`index.html` をブラウザで開きます。サーバー、DB、Auth、payment、RLS、外部 API は使いません。

## Scope

- ダッシュボード
- ライブ参戦ログ: event_name, artist_or_group, date, venue, seat, ticket_status, companion, emotion_tag, setlist_note, cost, memo
- グッズ管理: name, category, price, purchase_date, owned_count, memo
- 遠征費: event_name, transport, hotel, food, goods, other, total
- メモ/思い出記録
- localStorage 保存
- サンプルデータ
- 入力、編集、削除
- 一覧表示、簡単な集計、空状態 UI
- JSON export/import

## GPT Marketing Follow-up Fields

`マーケ戦略` GPT相談で候補になった以下3項目を、ライブ参戦ログに反映しています。

- `ticket_status`
- `companion`
- `emotion_tag`

## Operation

1. 初回表示ではサンプルデータが localStorage に保存されます。
2. 各タブの「追加」で新規作成し、フォームの「保存」で更新します。
3. 一覧の項目を選ぶと編集できます。
4. 「削除」で選択中の項目を削除できます。
5. 「Clear」で全データを空にし、空状態 UI を確認できます。
6. リロード後も同じブラウザの localStorage から復元されます。

## Safety

- `AUTO_POST=false` 維持
- `DRY_RUN=true` 維持
- Threads API 投稿なし
- Secrets/API キーなし
- DB/Auth/payment/RLS なし
- 外部 API なし
