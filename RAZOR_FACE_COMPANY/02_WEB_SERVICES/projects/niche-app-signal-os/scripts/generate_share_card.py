from __future__ import annotations

import html
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


WIDTH = 1080
HEIGHT = 1350


UI_PRESETS = {
    "receipt-payment-lookback": {
        "app_name": "あと買いログ",
        "screen_title": "購入メモ",
        "accent": "#7C6DF2",
        "soft": "#F0EDFF",
        "tabs": ["全部", "返品", "保証"],
        "summary": {"label": "探してるもの", "value": "レシート / 支払い履歴"},
        "cards": [
            {"title": "ワイヤレスイヤホン", "meta": "6/18  ECストア", "amount": "4,280円", "badge": "レシートあり"},
            {"title": "日用品まとめ買い", "meta": "6/12  コンビニ", "amount": "1,860円", "badge": "保証メモ"},
            {"title": "スマホケース", "meta": "6/04  EC購入", "amount": "2,190円", "badge": "返品期限 3日"},
        ],
        "detail_rows": [("支払い", "カード"), ("証跡", "写真 + 明細"), ("メモ", "返品するか確認")],
        "nav": ["ホーム", "検索", "追加", "メモ"],
    },
    "student-deadline-check": {
        "app_name": "提出物ボード",
        "screen_title": "明日いるもの",
        "accent": "#4B9BE8",
        "soft": "#EAF5FF",
        "tabs": ["今日", "明日", "今週"],
        "summary": {"label": "次の締切", "value": "英語レポート 12:00"},
        "cards": [
            {"title": "英語", "meta": "レポート下書き", "amount": "明日 12:00", "badge": "提出先: ポータル"},
            {"title": "ゼミ", "meta": "小テスト範囲確認", "amount": "金曜", "badge": "プリント"},
            {"title": "実習", "meta": "USB / ノート", "amount": "明日", "badge": "持ち物"},
        ],
        "detail_rows": [("提出先", "学校ポータル"), ("持ち物", "USB / プリント"), ("メモ", "朝もう一回見る")],
        "nav": ["時間割", "締切", "追加", "メモ"],
    },
    "live-trip-packing-check": {
        "app_name": "現場もちもの",
        "screen_title": "出発前チェック",
        "accent": "#FF7AA8",
        "soft": "#FFF0F6",
        "tabs": ["今日", "遠征", "前回"],
        "summary": {"label": "今日の現場", "value": "開場 18:00 / 雨かも"},
        "cards": [
            {"title": "チケット", "meta": "スマホ表示OK", "amount": "確認済み", "badge": "必須"},
            {"title": "身分証", "meta": "財布の内ポケット", "amount": "未確認", "badge": "忘れがち"},
            {"title": "モバ充", "meta": "ケーブル込み", "amount": "残量 82%", "badge": "持った"},
        ],
        "detail_rows": [("座席", "2階 C列"), ("双眼鏡", "持っていく"), ("前回メモ", "雨具忘れた")],
        "nav": ["現場", "持ち物", "追加", "ログ"],
    },
    "goods-stock-log": {
        "app_name": "グッズ棚",
        "screen_title": "持ち出し候補",
        "accent": "#58B889",
        "soft": "#EAFBF2",
        "tabs": ["全部", "交換", "現場"],
        "summary": {"label": "交換予定", "value": "日曜 現地 1件"},
        "cards": [
            {"title": "アクスタ A", "meta": "青ポーチ", "amount": "3個", "badge": "1個交換"},
            {"title": "缶バッジ", "meta": "透明ケース", "amount": "8個", "badge": "持ち出し"},
            {"title": "トレカ", "meta": "ファイル2", "amount": "12枚", "badge": "写真あり"},
        ],
        "detail_rows": [("保管", "青ポーチ"), ("写真", "登録済み"), ("メモ", "現場で確認")],
        "nav": ["棚", "交換", "追加", "写真"],
    },
    "subscription-overlap-check": {
        "app_name": "月額棚",
        "screen_title": "今月の更新",
        "accent": "#F2A94B",
        "soft": "#FFF5E8",
        "tabs": ["今月", "無料", "見直し"],
        "summary": {"label": "今月の月額", "value": "8,420円"},
        "cards": [
            {"title": "動画サービス", "meta": "6/24 更新", "amount": "1,490円", "badge": "見てる"},
            {"title": "AIツール", "meta": "6/27 更新", "amount": "3,000円", "badge": "要確認"},
            {"title": "クラウド", "meta": "無料期間", "amount": "あと2日", "badge": "通知"},
        ],
        "detail_rows": [("更新", "今週 3件"), ("無料期間", "あと2日"), ("メモ", "使ってない候補")],
        "nav": ["月額", "更新", "追加", "メモ"],
    },
}


def _selected_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return {}


def _browser_path() -> str:
    candidates = [
        os.getenv("CHROME_PATH", ""),
        os.getenv("BROWSER_PATH", ""),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        shutil.which("google-chrome") or "",
        shutil.which("chromium") or "",
        shutil.which("microsoft-edge") or "",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return ""


def _preset(candidate: dict) -> dict:
    candidate_id = candidate.get("candidate_id", "")
    if candidate_id in UI_PRESETS:
        return UI_PRESETS[candidate_id]
    return {
        "app_name": candidate.get("category", "ログ"),
        "screen_title": "今日見るもの",
        "accent": "#7C6DF2",
        "soft": "#F0EDFF",
        "tabs": ["今日", "保存", "メモ"],
        "summary": {"label": "あとで見る", "value": candidate.get("pain_point", "")[:18]},
        "cards": [
            {"title": "メモ", "meta": "あとで確認", "amount": "保存済み", "badge": "重要"},
            {"title": "スクショ", "meta": "写真フォルダ", "amount": "3件", "badge": "確認"},
            {"title": "履歴", "meta": "前回分", "amount": "1件", "badge": "メモ"},
        ],
        "detail_rows": [("状態", "保存済み"), ("場所", "スマホ内"), ("メモ", "あとで見る")],
        "nav": ["ホーム", "検索", "追加", "メモ"],
    }


def _html(candidate: dict, design: dict) -> str:
    ui = _preset(candidate)
    cards_html = "\n".join(
        f"""
        <article class="item">
          <div>
            <div class="item-title">{html.escape(card['title'])}</div>
            <div class="item-meta">{html.escape(card['meta'])}</div>
          </div>
          <div class="item-side">
            <strong>{html.escape(card['amount'])}</strong>
            <span>{html.escape(card['badge'])}</span>
          </div>
        </article>
        """
        for card in ui["cards"]
    )
    detail_html = "\n".join(
        f'<div class="detail-row"><span>{html.escape(label)}</span><strong>{html.escape(value)}</strong></div>'
        for label, value in ui["detail_rows"]
    )
    tabs_html = "\n".join(f'<span class="{ "active" if i == 0 else "" }">{html.escape(tab)}</span>' for i, tab in enumerate(ui["tabs"]))
    nav_html = "\n".join(f"<span>{html.escape(item)}</span>" for item in ui["nav"])
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1080, initial-scale=1">
<title>{html.escape(candidate.get("candidate_id", "mobile-ui"))}</title>
<style>
*{{box-sizing:border-box}}
body{{margin:0;width:{WIDTH}px;height:{HEIGHT}px;background:#f7f4ef;font-family:"Noto Sans CJK JP","Noto Sans JP","Yu Gothic","Hiragino Sans",Arial,sans-serif;color:#201d2a}}
.canvas{{width:{WIDTH}px;height:{HEIGHT}px;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#fff8fb 0%,#f6fbff 46%,#f7fff2 100%)}}
.phone{{width:710px;height:1288px;border-radius:76px;background:#1f1d2b;padding:24px;box-shadow:0 38px 90px rgba(48,40,70,.28)}}
.screen{{height:100%;border-radius:54px;background:#fffdfb;overflow:hidden;display:flex;flex-direction:column}}
.status{{height:58px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 38px 12px;font-size:22px;font-weight:800;color:#2d2938}}
.dots{{display:flex;gap:7px;align-items:center}}.dots i{{display:block;width:8px;height:8px;border-radius:99px;background:#2d2938}}.battery{{width:34px;height:16px;border:3px solid #2d2938;border-radius:5px;position:relative}}.battery:after{{content:"";position:absolute;right:-7px;top:3px;width:4px;height:6px;background:#2d2938;border-radius:2px}}
.app{{padding:22px 34px 26px;display:flex;flex-direction:column;gap:20px;flex:1}}
.topbar{{display:flex;align-items:center;justify-content:space-between}}
.app-name{{font-size:27px;font-weight:900;color:#6f6880}}
.avatar{{width:48px;height:48px;border-radius:18px;background:{ui['soft']};display:grid;place-items:center;color:{ui['accent']};font-size:24px;font-weight:900}}
h1{{font-size:48px;line-height:1.12;margin:0;font-weight:950;letter-spacing:0;color:#211d2b}}
.tabs{{height:58px;display:flex;align-items:center;gap:12px;overflow:hidden}}
.tabs span{{font-size:22px;font-weight:800;color:#8b8495;background:#f4f1f7;border-radius:999px;padding:13px 22px;white-space:nowrap}}
.tabs .active{{background:{ui['accent']};color:white}}
.summary{{background:{ui['soft']};border:2px solid rgba(32,29,42,.06);border-radius:30px;padding:25px 28px;display:flex;justify-content:space-between;gap:20px;align-items:center}}
.summary span{{display:block;font-size:22px;font-weight:850;color:#7c748a;margin-bottom:6px}}
.summary strong{{font-size:32px;line-height:1.18;font-weight:950;color:#211d2b}}
.summary .bubble{{min-width:86px;height:86px;border-radius:28px;background:white;display:grid;place-items:center;color:{ui['accent']};font-size:34px;font-weight:950;box-shadow:0 10px 28px rgba(58,48,78,.08)}}
.list{{display:flex;flex-direction:column;gap:14px}}
.item{{min-height:124px;background:white;border:2px solid #eee9f3;border-radius:28px;padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:18px;box-shadow:0 9px 24px rgba(46,40,65,.055)}}
.item-title{{font-size:29px;font-weight:950;color:#252130;margin-bottom:8px;max-width:350px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.item-meta{{font-size:22px;font-weight:750;color:#8a8294}}
.item-side{{text-align:right;display:flex;flex-direction:column;gap:9px;align-items:flex-end}}
.item-side strong{{font-size:27px;color:#211d2b;white-space:nowrap}}
.item-side span{{font-size:18px;font-weight:850;color:{ui['accent']};background:{ui['soft']};border-radius:999px;padding:8px 13px;white-space:nowrap}}
.detail{{margin-top:auto;background:#f8f6fa;border-radius:32px;padding:22px 26px;display:flex;flex-direction:column;gap:12px}}
.detail-row{{display:flex;align-items:center;justify-content:space-between;font-size:22px}}
.detail-row span{{font-weight:850;color:#8a8294}}.detail-row strong{{font-weight:950;color:#211d2b}}
.nav{{height:78px;border-top:2px solid #f0ecf5;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;text-align:center;color:#8a8294;font-size:18px;font-weight:850;background:#fffdfb}}
</style>
</head>
<body>
<main class="canvas">
  <section class="phone">
    <div class="screen">
      <div class="status"><span>9:41</span><div class="dots"><i></i><i></i><i></i><div class="battery"></div></div></div>
      <div class="app">
        <div class="topbar"><div class="app-name">{html.escape(ui['app_name'])}</div><div class="avatar">＋</div></div>
        <h1>{html.escape(ui['screen_title'])}</h1>
        <div class="tabs">{tabs_html}</div>
        <section class="summary"><div><span>{html.escape(ui['summary']['label'])}</span><strong>{html.escape(ui['summary']['value'])}</strong></div><div class="bubble">⌕</div></section>
        <section class="list">{cards_html}</section>
        <section class="detail">{detail_html}</section>
      </div>
      <nav class="nav">{nav_html}</nav>
    </div>
  </section>
</main>
</body>
</html>"""


def _write_png(html_path: Path, png_path: Path) -> tuple[bool, str]:
    browser = _browser_path()
    if not browser:
        return False, "browser_not_found"
    profile_dir = tempfile.mkdtemp(prefix="niche-share-card-")
    try:
        args = [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            "--hide-scrollbars",
            "--disable-features=Translate",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=1000",
            f"--user-data-dir={profile_dir}",
            f"--window-size={WIDTH},{HEIGHT}",
            "--force-device-scale-factor=1",
            f"--screenshot={png_path}",
            html_path.resolve().as_uri(),
        ]
        result = subprocess.run(args, cwd=OUTPUT_DIR.parent, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            return False, (result.stderr or result.stdout or "browser_screenshot_failed")[:500]
        return png_path.exists(), "ok" if png_path.exists() else "png_missing_after_screenshot"
    finally:
        shutil.rmtree(profile_dir, ignore_errors=True)


def run(sample: bool = False) -> dict:
    candidate = _selected_candidate()
    design = load_latest("design_strategy.json", {}).get("design_strategy", {})
    candidate_id = candidate.get("candidate_id") or "no-selected-candidate"
    output_dir = OUTPUT_DIR / "share-cards"
    html_path = output_dir / f"{today_iso()}-{candidate_id}.html"
    png_path = output_dir / f"{today_iso()}-{candidate_id}.png"
    write_text(html_path, _html(candidate, design))
    png_ok, png_status = _write_png(html_path, png_path)

    report_path = OUTPUT_DIR / "reports" / "daily_share_card_report.md"
    write_text(
        report_path,
        "\n".join(
            [
                f"# Daily Share Card Report - {today_iso()}",
                "",
                f"- candidate_id: {candidate_id}",
                f"- category: {candidate.get('category', '')}",
                f"- html: {html_path.relative_to(OUTPUT_DIR.parent)}",
                f"- png: {png_path.relative_to(OUTPUT_DIR.parent)}",
                f"- png_status: {png_status}",
                "- composition: mobile-app-screen-only",
                "- phone_ratio: 710x1288",
                "- sales_copy_removed: true",
                "",
            ]
        ),
    )
    payload = department_output(
        "Mobile UI Card Generator",
        "Generated a smartphone-first app UI screenshot without sales-copy framing.",
        scores={"width": WIDTH, "height": HEIGHT, "phone_width": 710, "phone_height": 1288, "png_generated": png_ok},
        risks=[] if png_ok else [png_status],
        next_action="quality gate",
        input_sources=["output/reports/daily_niche_ui_candidates.json", "output/reports/design_strategy.json"],
        extra={
            "candidate_id": candidate_id,
            "composition": "mobile-app-screen-only",
            "sales_copy_removed": True,
            "phone_ratio": {"width": 710, "height": 1288},
            "card_paths": {
                "html": str(html_path.relative_to(OUTPUT_DIR.parent)),
                "png": str(png_path.relative_to(OUTPUT_DIR.parent)),
            },
            "png_generated": png_ok,
            "png_status": png_status,
            "report": str(report_path.relative_to(OUTPUT_DIR.parent)),
        },
    )
    save_stage("daily_share_card.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Generate smartphone-first daily Threads UI card").parse_args()
    run(sample=args.sample)
