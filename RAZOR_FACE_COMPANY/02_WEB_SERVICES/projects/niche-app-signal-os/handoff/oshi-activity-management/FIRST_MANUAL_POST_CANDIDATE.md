# First Manual Post Candidate - Oshi Activity Management

Date: 2026-06-18

Status: Manual review candidate. Do not auto-post.

## Recommended Candidate

Use this first if manual QA passes.

```text
ライブの日程はカレンダー。
当落や入金はメールやスクショ。
グッズは写真。
遠征費は決済履歴。
感想はメモ。

でもあとで見返したい時は、だいたい
「この現場どうだったっけ？」
なんですよね。

現場ごとに、参戦ログ・グッズ・遠征費・思い出メモをまとめる小さな試作版を作っています。

ログインなし、ブラウザ保存だけ。
まずは「足りない項目」を知りたいです。

推し活の記録で、現場ごとに残せると便利な項目って何がありますか？
```

## Why This One

- Leads with the strongest GPT-approved angle: `現場ごとに散らかる情報`.
- Explains the problem before showing the tool.
- Says `試作版`, so it does not overclaim.
- Says `ログインなし`, matching the local-first MVP.
- Asks for missing fields, matching the current validation goal.

## Optional Short Version

```text
推し活の記録、日程はカレンダー、当落はメール、グッズは写真、遠征費は決済履歴、感想はメモに散らかりがち。

でも見返したい時は「この現場どうだったっけ？」なんですよね。

現場ごとに参戦ログ・グッズ・遠征費・思い出メモをまとめる、ログインなしの試作版を作っています。

足りない項目、何だと思いますか？
```

## Screenshot Guidance

Attach only after manual QA passes.

- Use dashboard screenshot first.
- Do not include personal information.
- Do not include real ticket details.
- Do not include payment details.
- Prefer sample data with fictional artist/event names.

## Pre-Post Checklist

- [ ] `DRY_RUN=true` confirmed.
- [ ] `AUTO_POST=false` confirmed.
- [ ] No Threads automation is running.
- [ ] MVP has no visible mojibake in browser.
- [ ] Dashboard screenshot is clean.
- [ ] Live log form includes `ticket_status`, `companion`, and `emotion_tag`.
- [ ] Post text says `試作版`.
- [ ] Post text does not claim sync, backup, official integration, or paid SaaS.

## Do Not Use Yet

Avoid these hooks for the first manual post:

- `推し活の支出を完全管理`
- `自動でチケット情報を整理`
- `クラウドに安全保存`
- `推し活SaaSを作りました`
- `公式連携できます`

These overpromise the MVP and create expectations outside the current safety scope.

## After Posting Manually

Record responses into project memory:

- Comments about current workaround.
- Requests for fields.
- Requests to try the prototype.
- Objections about localStorage.
- Requests for sync/reminders/photos.

Next decision:

- Strong pain comments: write note article.
- Prototype requests: build LP flow.
- Field requests: revise MVP before broader posting.

## Stop Conditions Before Manual Post

Do not post if manual QA finds any of these:

1. 保存・編集・削除・import/exportのどれかでデータが壊れる。
2. スマホ表示で主要操作が分かりにくい、または押せない。
3. 投稿文やLP文が「管理・節約・効率化」寄りで、推し活の温度感を壊している。

Final GPT decision: 追加実装は不要。完遂OK。
