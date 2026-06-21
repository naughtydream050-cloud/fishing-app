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


ROW_VALUES = {
    "live-trip-packing-check": {
        "チケット": "スマホ / 紙どっちも確認",
        "身分証": "財布の内ポケット",
        "充電器": "ケーブル + モバ充",
        "双眼鏡": "座席で持つか決める",
        "現場メモ": "開場18:00 / 雨かも",
    },
    "subscription-overlap-check": {
        "サービス": "動画 / AI / 音楽",
        "月額": "合計 8,420円",
        "更新日": "今週 3件",
        "無料期間": "あと2日",
        "見直しメモ": "使ってない候補あり",
    },
    "student-deadline-check": {
        "授業": "英語 / ゼミ / 実習",
        "提出物": "レポート下書き",
        "締切": "明日 12:00",
        "提出先": "ポータル",
        "持ち物": "USB / プリント",
    },
    "goods-stock-log": {
        "グッズ名": "アクスタ / 缶バッジ",
        "所持数": "3個 / 交換1件",
        "保管場所": "青ポーチ",
        "写真": "持ち出し候補だけ表示",
        "交換予定": "日曜 現地",
    },
    "receipt-payment-lookback": {
        "購入日": "6/18",
        "お店": "EC / コンビニ",
        "金額": "4,280円",
        "支払い方法": "カード",
        "レシート": "写真あり",
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


def _card_rows(candidate: dict, design: dict) -> list[tuple[str, str]]:
    values = ROW_VALUES.get(candidate.get("candidate_id"), {})
    fields = design.get("must_show_fields") or list(values.keys()) or ["メモ", "状態", "あとで見返す"]
    return [(field, values.get(field, "あとで見返す用に残す")) for field in fields[:5]]


def _html(candidate: dict, design: dict) -> str:
    headline = candidate.get("pain_point", "あとで見返したい情報、散らばらない？")
    if len(headline) > 42:
        headline = headline[:42] + "..."
    title = candidate.get("category", "ニッチログ")
    rows_html = "\n".join(
        f'<div class="row"><span>{html.escape(label)}</span><strong>{html.escape(value)}</strong></div>'
        for label, value in _card_rows(candidate, design)
    )
    cta = design.get("card_cta") or "これ欲しい？今のやり方で十分？"
    metaphor = design.get("ui_metaphor_from_market_need") or candidate.get("expected_ui_metaphor", "スマホログUI")
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1080, initial-scale=1">
<title>{html.escape(candidate.get("candidate_id", "daily-card"))}</title>
<style>
*{{box-sizing:border-box}}
body{{margin:0;width:{WIDTH}px;height:{HEIGHT}px;background:#fffaf7;font-family:"Noto Sans CJK JP","Noto Sans JP","Yu Gothic","Hiragino Sans",Arial,sans-serif;color:#25212e}}
.canvas{{width:{WIDTH}px;height:{HEIGHT}px;padding:70px 72px;background:linear-gradient(155deg,#fff6fb 0%,#eefbff 52%,#f6fff0 100%)}}
.top{{height:230px;display:flex;flex-direction:column;justify-content:flex-end}}
.eyebrow{{font-size:29px;font-weight:800;color:#7b6aa0;margin-bottom:18px}}
h1{{font-size:54px;line-height:1.18;margin:0;font-weight:900;letter-spacing:0;color:#272236}}
.phone-wrap{{height:800px;display:flex;align-items:center;justify-content:center}}
.phone{{width:650px;height:742px;border-radius:58px;background:#252232;padding:24px;box-shadow:0 34px 70px rgba(92,70,112,.24)}}
.screen{{height:100%;border-radius:40px;background:#fffefd;padding:34px 30px;overflow:hidden}}
.app-head{{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}}
.app-title{{font-size:31px;font-weight:900;max-width:430px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.pill{{font-size:21px;font-weight:900;color:#6f5eb2;background:#eee9ff;border-radius:999px;padding:10px 16px}}
.hero-card{{background:#e9fff5;border:2px solid #bdeed9;border-radius:26px;padding:20px 22px;margin-bottom:18px}}
.hero-card .label{{font-size:21px;color:#6e7781;font-weight:800}}
.hero-card .main{{font-size:32px;line-height:1.25;font-weight:900;margin-top:8px}}
.row{{display:grid;grid-template-columns:170px 1fr;gap:18px;align-items:center;background:#fff;border:2px solid #eee9f6;border-radius:22px;padding:17px 20px;margin:12px 0;box-shadow:0 8px 20px rgba(92,77,118,.06)}}
.row span{{font-size:22px;color:#82778e;font-weight:900}}
.row strong{{font-size:25px;line-height:1.25;color:#2d2838}}
.footer{{height:180px;display:flex;align-items:flex-start;justify-content:space-between;gap:26px}}
.cta{{font-size:39px;line-height:1.25;font-weight:900;color:#2c2538;max-width:710px}}
.badge{{font-size:24px;font-weight:900;color:#fff;background:#ff7aa8;border-radius:999px;padding:16px 22px;white-space:nowrap}}
</style>
</head>
<body>
<main class="canvas">
  <section class="top">
    <div class="eyebrow">こういう小さい不便、専用で欲しくない？</div>
    <h1>{html.escape(headline)}</h1>
  </section>
  <section class="phone-wrap">
    <div class="phone"><div class="screen">
      <div class="app-head"><div class="app-title">{html.escape(title)}</div><div class="pill">DRY RUN</div></div>
      <div class="hero-card"><div class="label">今日の画面メタファー</div><div class="main">{html.escape(metaphor)}</div></div>
      {rows_html}
    </div></div>
  </section>
  <section class="footer">
    <div class="cta">{html.escape(cta)}</div>
    <div class="badge">Threads案</div>
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
                "",
            ]
        ),
    )
    payload = department_output(
        "UI Share Card Generator",
        "Generated a candidate-specific Threads UI card image from the selected market need.",
        scores={"width": WIDTH, "height": HEIGHT, "png_generated": png_ok},
        risks=[] if png_ok else [png_status],
        next_action="quality gate",
        input_sources=["output/reports/daily_niche_ui_candidates.json", "output/reports/design_strategy.json"],
        extra={
            "candidate_id": candidate_id,
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
    args = cli_parser("Generate daily Threads UI share card").parse_args()
    run(sample=args.sample)
