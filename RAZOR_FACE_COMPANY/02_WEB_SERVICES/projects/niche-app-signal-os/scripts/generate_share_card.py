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


def _selected_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return (pack.get("candidates") or [{}])[0]


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
        shutil.which("chromium-browser") or "",
        shutil.which("microsoft-edge") or "",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return ""


def _card_rows(candidate: dict, design: dict) -> list[tuple[str, str]]:
    if candidate.get("candidate_id") == "oshi-activity-management":
        return [
            ("座席", "2階 Cブロック 14列"),
            ("セトリメモ", "アンコールで泣いた曲だけ残す"),
            ("買ったグッズ", "アクスタ / タオル / ランダム2"),
            ("遠征費と感情", "20,200円 / 余韻・最高"),
        ]
    fields = design.get("must_show_fields") or ["メモ", "状態", "日付", "次の行動"]
    return [(str(field), "あとで見返す用に残す") for field in fields[:6]]


def _html(candidate: dict, design: dict, post_text: str) -> str:
    headline = candidate.get("pain_point", "あとで見返したい情報が散らばる")
    if candidate.get("candidate_id") == "oshi-activity-management":
        headline = "推し活の記録、気づいたら大散乱してない？"
    app_display_name = "推し活ログ" if candidate.get("candidate_id") == "oshi-activity-management" else candidate.get("category", "ニッチ需要")
    cta = design.get("card_cta") or "これ欲しい？Notionで十分？"
    rows = _card_rows(candidate, design)
    rows_html = "\n".join(
        f'<div class="row"><span>{html.escape(label)}</span><strong>{html.escape(value)}</strong></div>' for label, value in rows
    )
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1080, initial-scale=1">
<title>{html.escape(candidate.get("candidate_id", "daily-share-card"))}</title>
<style>
*{{box-sizing:border-box}}
body{{margin:0;width:{WIDTH}px;height:{HEIGHT}px;background:#f8f4ff;font-family:"Yu Gothic","Hiragino Sans","Noto Sans JP",Arial,sans-serif;color:#282436}}
.canvas{{width:{WIDTH}px;height:{HEIGHT}px;padding:72px 74px;background:linear-gradient(160deg,#fff5fb 0%,#f4fbff 45%,#f7fff3 100%)}}
.top{{height:232px;display:flex;flex-direction:column;justify-content:flex-end}}
.eyebrow{{font-size:30px;font-weight:700;color:#7e6aa8;margin-bottom:18px}}
h1{{font-size:58px;line-height:1.16;margin:0;letter-spacing:0;font-weight:900;color:#272132}}
.phone-wrap{{height:800px;display:flex;align-items:center;justify-content:center}}
.phone{{width:650px;height:742px;border-radius:58px;background:#24202f;padding:24px;box-shadow:0 34px 70px rgba(80,61,111,.23)}}
.screen{{height:100%;border-radius:40px;background:#fffdfb;padding:34px 30px;overflow:hidden}}
.app-head{{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}}
.app-title{{font-size:32px;font-weight:900}}
.pill{{font-size:22px;font-weight:800;color:#6552a2;background:#eee8ff;border-radius:999px;padding:10px 16px}}
.hero-card{{background:#eafff5;border:2px solid #b9efd5;border-radius:26px;padding:20px 22px;margin-bottom:16px}}
.hero-card .label{{font-size:22px;color:#6d7780;font-weight:800}}
.hero-card .main{{font-size:34px;font-weight:900;margin-top:8px}}
.row{{display:grid;grid-template-columns:180px 1fr;gap:18px;align-items:center;background:#ffffff;border:2px solid #eee8f5;border-radius:22px;padding:16px 20px;margin:11px 0;box-shadow:0 8px 20px rgba(92,77,118,.06)}}
.row span{{font-size:22px;color:#82778e;font-weight:800}}
.row strong{{font-size:25px;line-height:1.25;color:#2d2838}}
.footer{{height:184px;display:flex;align-items:flex-start;justify-content:space-between;gap:26px}}
.cta{{font-size:40px;line-height:1.25;font-weight:900;color:#2c2538;max-width:680px}}
.badge{{font-size:24px;font-weight:900;color:#fff;background:#ff7aa8;border-radius:999px;padding:16px 22px;white-space:nowrap}}
</style>
</head>
<body>
<main class="canvas">
  <section class="top">
    <div class="eyebrow">こういうの、地味に欲しくない？</div>
    <h1>{html.escape(headline)}</h1>
  </section>
  <section class="phone-wrap">
    <div class="phone">
      <div class="screen">
        <div class="app-head"><div class="app-title">{html.escape(design.get("ui_metaphor_from_market_need") or design.get("ui_metaphor", ["ログ"])[0])}</div><div class="pill">DRY RUN</div></div>
        <div class="hero-card"><div class="label">今日のログ</div><div class="main">{html.escape(app_display_name)}</div></div>
        {rows_html}
      </div>
    </div>
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
    post = load_latest("threads_post.json", {}).get("post", {})
    candidate_id = candidate.get("candidate_id") or "daily-candidate"
    output_dir = OUTPUT_DIR / "share-cards"
    html_path = output_dir / f"{today_iso()}-{candidate_id}.html"
    png_path = output_dir / f"{today_iso()}-{candidate_id}.png"
    write_text(html_path, _html(candidate, design, post.get("text", "")))
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
                f"- ui_metaphor: {design.get('ui_metaphor_from_market_need') or candidate.get('ui_metaphor', '')}",
                f"- html: {html_path.relative_to(OUTPUT_DIR.parent)}",
                f"- png: {png_path.relative_to(OUTPUT_DIR.parent)}",
                f"- png_status: {png_status}",
                "",
                "## Composition",
                "- Top: pain/あるある copy",
                "- Center: smartphone app-like UI",
                "- Bottom: light CTA",
            ]
        ),
    )
    payload = department_output(
        "UI Share Card Generator",
        "Generated a Threads UI-card asset from the selected market need candidate.",
        scores={"width": WIDTH, "height": HEIGHT, "png_generated": png_ok},
        risks=[] if png_ok else [png_status],
        next_action="quality gate",
        input_sources=["output/reports/daily_niche_ui_candidates.json", "output/reports/design_strategy.json", "output/reports/threads_post.json"],
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
