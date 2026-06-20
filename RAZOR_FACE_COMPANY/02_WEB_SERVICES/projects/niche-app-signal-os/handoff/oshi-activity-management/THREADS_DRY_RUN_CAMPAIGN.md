# Threads DRY_RUN Campaign - Oshi Activity Management

Date: 2026-06-06

## Purpose

Validate whether the MVP framing is worth turning into public Threads posts, note content, and a simple LP. These are draft posts only.

## Safety

- DRY_RUN only.
- Do not post automatically.
- Do not call Threads API.
- Do not include personal information, ticket screenshots, emails, IDs, or payment details.

## Variant 1 - Problem Framing

ライブの日程はカレンダーにある。  
感想はメモにある。  
グッズは写真にある。  
遠征費は決済履歴にある。  

でも「この現場、結局なに買って、いくら使って、どんな席で、何を覚えてる？」を見返す時に散らかる。  

現場ごとに、参戦ログ・グッズ・遠征費・メモをまとめる小さいローカル管理ボードを作ったら便利だろうか。

## Variant 2 - MVP Preview

推し活用に、ログインなしで触れる小さな管理ボードを試作。  

- ライブ参戦ログ
- グッズ管理
- 遠征費メモ
- 思い出メモ
- ブラウザ内保存

Notionほど作り込まず、カレンダーほど予定だけに寄せず、現場ごとに見返せる形。  

足すなら「当落」「入金期限」「同行者メモ」あたりだと思っている。

## Variant 3 - Feedback Ask

推し活の記録って、何を残せると本当に便利なんだろう。  

今の試作版に入れているのは、参戦ログ、グッズ、遠征費、メモ。  
でも実際は、当落、入金期限、交換予定、同行者、セトリ、写真、次にやることも欲しくなりそう。  

ログインなしのローカル保存だけでも、まず触ってみたい人はいるだろうか。

## Evaluation Notes

Keep:
- Comments with concrete fields.
- Saves/bookmarks.
- Questions about prototype access.
- Mentions of current workaround.

Reduce:
- Generic "便利そう" only.
- Requests that require DB/Auth/sync before the MVP has demand proof.

## Next Decision

If Variant 1 gets the clearest pain comments, publish note first.  
If Variant 2 gets prototype requests, make LP first.  
If Variant 3 gets feature suggestions, update MVP fields before LP.
