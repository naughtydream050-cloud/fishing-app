# Manual Threads Target Report

Date: 2026-06-20

Status: configured for manual review only.

## Target Account

- platform: Threads
- display_name: 有能サイト紹介
- handle: `younengsaitoshaojie`
- source: user-provided screenshot

## Positioning Fit

The account introduces useful Web sites and AI tools. The oshi-activity-management MVP should be framed as a small useful Web prototype, not as a finished SaaS or automated posting product.

Recommended framing:

- 便利な小道具
- あとで見返すログ
- Notionで十分か聞く
- 試作UI

Avoid:

- 完成SaaS
- 自動投稿
- 公式連携
- 課金/節約煽り
- AUTO_POST=true

## Recommended Manual Post

```text
現場のこと、あとで見返そうと思っても散らばりがちじゃない？
座席はスクショ、セトリはメモ、遠征費は決済履歴、グッズは写真。
ライブごとにまとめて残せる推し活ログの試作UIを作ってます。
これ欲しい？それともNotionで十分？
```

Image:

- `output/share-cards/oshi-activity-management-A.png`

## Safety

- DRY_RUN=true
- AUTO_POST=false
- Threads real posting: false
- Chrome posting: false
- Manual owner review required: true
