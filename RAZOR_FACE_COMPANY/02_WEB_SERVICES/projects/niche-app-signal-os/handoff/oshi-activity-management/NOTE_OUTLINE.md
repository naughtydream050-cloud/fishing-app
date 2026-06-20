# Note Outline - Oshi Activity Management

Date: 2026-06-06

## Working Title

推し活の予定と記録、なぜカレンダーとメモだけだと散らかるのか

## Target Reader

ライブ参戦、グッズ購入、遠征、思い出メモを別々の場所で管理していて、後から探す時間が増えている人。

## Angle

「推し活が大変」ではなく、「楽しい予定の周辺情報だけが散らかる」という小さな不便に絞る。

## Structure

1. Hook
   - ライブの日程はカレンダーにある。
   - 感想はメモにある。
   - グッズは写真にある。
   - 遠征費はレシートや決済履歴にある。
   - でも、現場単位で見返すとまとまっていない。

2. Current Workarounds
   - カレンダー
   - メモアプリ
   - スクショ
   - スプレッドシート
   - DM
   - Notion

3. Why It Breaks
   - 情報の粒度が違う。
   - 予定、支払い、購入、思い出が別のタイミングで発生する。
   - あとで探す時は「日付」ではなく「現場」で探したい。

4. MVP Hypothesis
   - 現場ごとに、ライブログ・グッズ・遠征費・メモを並べるだけで十分便利かもしれない。
   - まずはログインなし、ローカル保存だけで試せる。

5. Prototype Screenshot / Demo
   - ダッシュボード
   - ライブ参戦ログ
   - グッズ管理
   - 遠征費
   - メモ

6. What It Does Not Do Yet
   - 通知なし
   - 同期なし
   - 写真保存なし
   - 公式チケット連携なし
   - 共有機能なし

7. Feedback CTA
   - 「自分ならどの項目を足すか」
   - 「Notion/スプレッドシートで足りないところ」
   - 「ローカル保存だけでも触るか」

## Draft CTA

試作版は、ログインなしで触れる小さなローカル管理ボードです。  
もし「現場ごとにこれも残したい」という項目があれば、コメントで教えてください。

## Safety

- Do not publish automatically.
- Do not include API keys, accounts, private data, or screenshots containing personal information.
- Treat all copy as DRY_RUN until owner review.
