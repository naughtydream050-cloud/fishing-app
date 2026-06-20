# Marketing Validation Pack - Oshi Activity Management

Date: 2026-06-06

## GPT Decision

Next step is not live posting. Build a Marketing Validation Pack.

Priority:

1. `MARKETING_VALIDATION_PACK.md`
2. `THREADS_DRY_RUN_POSTS.md`
3. `NOTE_DRAFT_OUTLINE.md`
4. `LP_FIRST_VIEW_COPY.md`
5. `FEEDBACK_CHECKLIST.md`

## Strategic Direction

Primary angle:

A. 現場ごとに散らかる情報

Secondary comparison angles:

B. グッズ/遠征費でお金が見えない  
C. 思い出が残らない

The first public-facing hypothesis should focus on "現場ごとに散らかる情報". It is broader than money tracking and more concrete than a memory diary.

## Product Position

This is a local-first prototype, not a finished SaaS.

Use:

- 試作版
- ログインなし
- ブラウザ保存
- 現場ごとに見返せる
- 足りない項目を教えてほしい

Avoid:

- 完全版
- 自動連携
- 公式対応
- クラウド保存
- 安全にバックアップ
- 有料プラン
- SaaS開始

## Validation Sequence

1. Run DRY_RUN copy review with A/B/C Threads variants.
2. Owner/GPT selects strongest variant.
3. If pain comments are expected, prepare note draft.
4. If prototype requests are expected, prepare LP first view.
5. If missing-field comments are expected, revise MVP fields before LP.

## Recommended Minimum Field Candidates

GPT suggested up to three additional fields:

- `ticket_status`
- `companion`
- `emotion_tag`

For this pass, keep them as validation candidates in copy and checklist. Do not add database, Auth, payment, external APIs, or live integrations.

## Success Criteria

- Users describe their current workaround.
- Users mention a missing field without being prompted.
- Users ask to try the prototype.
- Users save/comment on the "現場ごと" framing.

## Stop Criteria

- Users only want reminders/sync before seeing value.
- Users need ticket-site integration immediately.
- Comments frame the idea as a generic diary rather than a management board.

## Safety

- `DRY_RUN=true`
- `AUTO_POST=false`
- Threads real posting prohibited
- Secrets prohibited
- DB/Auth/payment/RLS prohibited
- External API prohibited
