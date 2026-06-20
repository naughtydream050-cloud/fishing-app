# Next Build Prompt

あなたはCodexです。

Task:
Niche App Signal OSのDRY_RUNレビューで選ばれた `oshi-activity-management` を、DB/Auth/paymentなしのローカルファーストWeb MVPとして新規実装してください。

Read first:
- `handoff/oshi-activity-management/BUILD_HANDOFF.md`
- `handoff/oshi-activity-management/MVP_SPEC.md`
- `handoff/oshi-activity-management/THREADS_EVIDENCE.md`

Constraints:
- AUTO_POSTやThreads APIには触らない
- Secrets/API keysを扱わない
- 既存productionや他プロジェクトを触らない
- DB/Auth/payment/RLSなし
- localStorageで保存
- 日本語UI

Build:
- 現場カード一覧
- 当落/入金/同行者/費用/メモ編集
- 次の期限サマリー
- JSON export/import

Verify:
- local run
- lint/build相当
- 主要UIが日本語で読める
- データ追加/編集/削除/保存ができる
