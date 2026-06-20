Task:
Niche App Signal OSの7日DRY_RUN成果物を、月一万円獲得に近づける実運用計画へ落とし込みたい。

Context:
対象プロジェクトは `D:\Development\RAZOR_FACE_COMPANY\02_WEB_SERVICES\projects\niche-app-signal-os`。
初期実装と7日DRY_RUN検証は完了済み。
`DRY_RUN=true`、`AUTO_POST=false`、Threads API実投稿なし、Secrets実値なし。
生成済み成果物:
- 7日分のThreads投稿案 Markdown/JSON
- 7日分のカード画像 SVG/HTML
- 7日分のMemory Box research/council
- `memory/reports/weekly_report.md`
- `data/build_candidates.json`
- `data/note_candidates.json`
- `data/post_log.json`
- `output/reports/dry_run_batch_report.md`
- `output/reports/sample_post_review.md`
- `reports/latest/context-pack.json`

7日DRY_RUNのカテゴリ:
1. 推し活管理
2. ライブ参戦記録
3. グッズ管理
4. 遠征費管理
5. レシート家計簿
6. 大学生向け家計簿
7. SNS投稿管理

検証結果:
- 7日分の投稿素材生成 OK
- 7日分のカード画像生成 OK
- Memory/Council生成 OK
- weekly_report/build_candidates/note_candidates生成 OK
- Quality Gateは低品質fixtureを停止 OK
- AUTO_POST=false維持 OK
- Threads API called=false

Options:
1. Threads実投稿はまだ手動で行い、反応を `data/post_log.json` に追記して学習する。
2. 反応が強い1カテゴリだけ、無料LPまたは待機リストページにする。
3. noteで「なぜ作るか」記事を先に出し、月一万円の導線を検証する。
4. AUTO_POST=trueはまだ使わず、投稿素材生成と手動投稿予約だけで運用する。

Risk:
- AUTO_POST=true化はThreads API権限、Secrets、規約、スパム判定の判断が必要。
- 手動投稿でも、投稿文が量産感・パクリ感・完成品詐称に見えると信頼を落とす。
- 月一万円獲得を急ぎすぎると、Web化対象が絞れず拡散する。
- 既存プロジェクトやproduction設定には触れない方針。

Recommended:
まず7日分を手動投稿または予約投稿で試す。
反応が一番強いカテゴリを1つ選び、無料ミニLPかnote記事へ変換する。
月一万円の初期導線は、SaaS本体ではなく「テンプレ/診断/相談/小さな有料note」のどれが早いかで判断する。
AUTO_POST=trueは、手動運用で投稿品質と規約リスクを確認してから別判断にする。

Question:
月一万円獲得を最短で狙うなら、次にCodexで実装すべきはどれですか？
1. 反応記録用の手動入力CSV/JSONと分析強化
2. 1カテゴリのLP/待機リストページ
3. note記事ドラフト生成
4. 有料テンプレ/診断商品の最小販売ページ案
5. まだ投稿品質改善を優先
