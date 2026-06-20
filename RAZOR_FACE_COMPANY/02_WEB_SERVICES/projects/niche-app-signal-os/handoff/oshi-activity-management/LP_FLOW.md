# LP Flow - Oshi Activity Management

Date: 2026-06-06

## Goal

Create a simple validation LP that explains the MVP and routes users to feedback. It should not imply production readiness or paid SaaS availability.

## First View

Headline:
推し活の予定、参戦記録、グッズ、遠征費を1つにまとめるローカル管理ボード

Subcopy:
ログインなし。ブラウザ保存だけ。まずは「現場ごとに見返せると便利か」を試すための小さなMVPです。

Primary CTA:
試作版を開く

Secondary CTA:
足りない項目を見る

Visual:
MVP dashboard screenshot or short screen capture. Do not use abstract hero graphics.

## Sections

1. Problem
   - 予定はカレンダー、感想はメモ、グッズは写真、遠征費は決済履歴に分かれる。
   - あとで見返す時に「現場単位」でまとまっていない。

2. MVP
   - ライブ参戦ログ
   - グッズ管理
   - 遠征費メモ
   - メモ/思い出記録
   - localStorage保存

3. Why Local-First
   - すぐ触れる。
   - アカウント不要。
   - 試作段階で個人情報を集めない。

4. Current Limitations
   - 同期なし
   - 通知なし
   - 写真アップロードなし
   - 共有なし
   - チケット連携なし

5. Feedback Request
   - 何を足したいか。
   - どの画面が先に必要か。
   - ローカル保存だけで試す価値があるか。

## CTA Destination

For the current stage, the CTA should open the static MVP or point to a feedback form draft. Do not connect live posting, Auth, DB, payment, or external APIs in this project.

## Measurement

- Number of comments that include a concrete field request.
- Number of people asking for the prototype.
- Number of requests for sync/reminder/photo features.
- Whether "goods" and "travel cost" are mentioned without prompting.

## Copy Guardrails

- Avoid "完全版", "公式", "自動連携", "安全にクラウド保存".
- Use "試作版", "ローカル保存", "ログインなし", "フィードバック募集".
