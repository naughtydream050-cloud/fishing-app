# Oshi Activity Management MVP Marketing Review

Date: 2026-06-18

Status: Pre-post review. Do not post automatically.

## Summary

The strongest first marketing angle remains:

`現場ごとに散らかる情報`

This is broader and more natural than starting with only money tracking or memory preservation. It also lets the MVP's four parts make sense together: live logs, goods, travel costs, and memories.

## MVP Screen / Flow Readiness

Current MVP supports:

- Dashboard summary.
- Live attendance log.
- Goods management.
- Travel cost memo.
- Memory memo.
- localStorage persistence.
- JSON import/export.
- Empty states.
- GPT-suggested live log fields: `ticket_status`, `companion`, `emotion_tag`.

The screen flow is suitable for manual review. It should not be presented as a finished SaaS.

## Main User Promise

Use:

> ライブの日程、当落、グッズ、遠征費、感想がバラバラになる問題を、現場ごとに見返せるようにする試作版。

Avoid:

- 完全管理
- 自動連携
- 公式対応
- クラウド保存
- 安全にバックアップ
- 有料プラン開始
- SaaSとして提供中

## 1. MVP画面確認項目

- Dashboard screenshot should show the product in one glance.
- The live log form should visibly include `ticket_status`, `companion`, and `emotion_tag`.
- Goods and travel screens should support the claim that money-related information can be kept near the live record.
- Memo screen should support the claim that memories can be kept without turning the product into a diary-only app.

## 2. localStorage確認項目

- Say `ログインなし`.
- Say `ブラウザ保存`.
- Do not say `バックアップ`.
- Do not say data is synced.
- Before posting, manually confirm a new live log remains after reload.

## 3. スマホ表示確認項目

Manual post traffic is likely mobile-first. Before any public post:

- Confirm dashboard first view is readable on mobile.
- Confirm the tab row is usable.
- Confirm the live log form is not visually overwhelming.
- Confirm CTA screenshots do not crop important controls.

## 4. 日本語/文字化け確認項目

- Check `index.html` and `app.js` through a browser, not PowerShell output.
- Reject any screenshot containing mojibake.
- Reject any copy that sounds like machine translation.

## 5. 推し活ユーザー目線の違和感

Potential friction:

- `管理` can feel too utilitarian if pushed too hard.
- Money tracking can feel like a household-budget app if it leads the post.
- Memory tracking can feel too diary-like if it leads the post.
- `companion` should be framed as a private memo, not sharing.
- `emotion_tag` should feel lightweight and optional.

Recommended framing:

> 散らかった推し活メモを、現場ごとに見返せるようにする。

## 6. 最初に手動投稿するならどの投稿文か

Use Variant A: `現場ごとに散らかる情報`.

Reason:

- It matches the full MVP.
- It naturally introduces ticket status, goods, travel, and memories.
- It invites comments about missing fields.
- It does not overpromise automation or integrations.

## 7. 投稿前に直すべき最小修正

Required before manual post:

1. Confirm the browser-rendered MVP has no visible mojibake.
2. Confirm localStorage persistence after reload.
3. Capture a clean dashboard screenshot with no personal data.
4. If screenshot includes sample names, keep them fictional.
5. Use `試作版` and `ログインなし` in the post.

Not required before first manual post:

- Auth.
- DB.
- Payment.
- RLS.
- Cloud sync.
- Reminders.
- Ticket integrations.
- Public feedback form.

## 8. まだ実投稿しない前提の次アクション

1. Owner manually reviews the MVP in browser using `oshi_mvp_manual_qa_checklist.md`.
2. Owner reviews `FIRST_MANUAL_POST_CANDIDATE.md`.
3. If approved, post manually outside automation.
4. After manual response, record comments/saves/questions into Memory.
5. Decide next step:
   - Pain comments: write note article.
   - Prototype requests: make LP.
   - Field requests: revise MVP fields.

## Final Recommendation

Do not enable posting automation.

Proceed only with manual review of Variant A and browser QA. The current MVP is strong enough for a cautious manual validation post if the manual QA checklist passes.

## Final GPT Check

Date: 2026-06-18

Chrome MCP was used to consult the `マーケ戦略` ChatGPT tab after this review and the manual QA artifacts were prepared.

GPT answer:

> このまま手動QAへ。完遂前の追加実装は不要です。

Decision:

- No additional MVP implementation before QA.
- Proceed to browser/manual QA.
- Keep any Threads post manual-only after owner approval.

## Final Red-Flag Check

GPT was asked for only the conditions that should stop the first manual post.

Stop posting if:

1. 保存・編集・削除・import/exportのどれかでデータが壊れる。
2. スマホ表示で主要操作が分かりにくい、または押せない。
3. 投稿文やLP文が「管理・節約・効率化」寄りで、推し活の温度感を壊している。

GPT final decision: 追加実装は不要。完遂OK。
