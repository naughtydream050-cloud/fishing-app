from __future__ import annotations

import html

from common import OUTPUT_DIR, cli_parser, department_output, load_latest, save_stage, today_iso, write_text


def _svg_card(headline: str, rows: list[str], footer: str) -> str:
    safe_headline = html.escape(headline[:42])
    safe_footer = html.escape(footer[:36])
    safe_rows = [html.escape(r[:30]) for r in rows[:4]]
    row_svg = "\n".join(
        f'<rect x="135" y="{445 + i*116}" width="810" height="78" rx="18" fill="#ffffff" stroke="#d6dee8"/><text x="176" y="{494 + i*116}" font-size="34" fill="#1d2733">{row}</text>'
        for i, row in enumerate(safe_rows)
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<rect width="1080" height="1350" fill="#f6f1e8"/>
<rect x="90" y="96" width="900" height="1158" rx="32" fill="#fdfaf4" stroke="#d9cbb8" stroke-width="3"/>
<text x="135" y="194" font-size="42" fill="#1f2933" font-family="Arial, sans-serif" font-weight="700">こんな小さい面倒ない？</text>
<foreignObject x="135" y="238" width="810" height="150"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,'Yu Gothic',sans-serif;font-size:52px;font-weight:700;line-height:1.24;color:#17202a;">{safe_headline}</div></foreignObject>
<rect x="135" y="410" width="810" height="560" rx="28" fill="#eef6f2" stroke="#b8d2c6" stroke-width="3"/>
<text x="176" y="480" font-size="28" fill="#617064" font-family="Arial, sans-serif">架空アプリUI</text>
{row_svg}
<rect x="176" y="900" width="308" height="34" rx="17" fill="#2f6f68"/>
<rect x="506" y="900" width="232" height="34" rx="17" fill="#d88a48"/>
<text x="135" y="1088" font-size="38" fill="#1f2933" font-family="Arial, 'Yu Gothic', sans-serif" font-weight="700">{safe_footer}</text>
<text x="135" y="1170" font-size="26" fill="#60707f" font-family="Arial, sans-serif">Niche App Signal OS / DRY RUN</text>
</svg>'''


def _html_card(headline: str, rows: list[str], footer: str) -> str:
    rows_html = "".join(f"<li>{html.escape(row)}</li>" for row in rows[:4])
    return f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>Signal Card</title>
<style>
body{{margin:0;background:#f6f1e8;font-family:Arial,'Yu Gothic',sans-serif;color:#1f2933}}
.card{{width:1080px;height:1350px;box-sizing:border-box;padding:96px 90px}}
.panel{{height:100%;border:3px solid #d9cbb8;border-radius:32px;background:#fdfaf4;padding:72px 44px;box-sizing:border-box}}
.eyebrow{{font-size:42px;font-weight:700;margin-bottom:30px}}
h1{{font-size:56px;line-height:1.22;margin:0 0 42px}}
.mock{{background:#eef6f2;border:3px solid #b8d2c6;border-radius:28px;padding:44px;margin-bottom:78px}}
.label{{font-size:28px;color:#617064;margin-bottom:22px}}
li{{list-style:none;background:white;border:1px solid #d6dee8;border-radius:18px;padding:24px 34px;margin:18px 0;font-size:34px}}
.footer{{font-size:38px;font-weight:700;margin-top:0}}
.meta{{font-size:26px;color:#60707f;margin-top:70px}}
</style></head><body><main class="card"><section class="panel"><div class="eyebrow">こんな小さい面倒ない？</div><h1>{html.escape(headline)}</h1><div class="mock"><div class="label">架空アプリUI</div><ul>{rows_html}</ul></div><div class="footer">{html.escape(footer)}</div><div class="meta">Niche App Signal OS / DRY RUN</div></section></main></body></html>"""


def run(sample: bool = False) -> dict:
    council = load_latest("llm_council.json", {}).get("decision_payload", {})
    design_strategy = load_latest("design_strategy.json", {}).get("design_strategy", {})
    card = council.get("image_card") or {
        "headline": "遠征費とチケット情報がバラバラになる",
        "mock_ui": ["ライブ別に保存", "交通費メモ", "チケット期限通知"],
        "footer": "こんなサイトあったら便利？",
    }
    svg = _svg_card(card["headline"], card.get("mock_ui", []), card.get("footer", "こんなサイトあったら便利？"))
    html_doc = _html_card(card["headline"], card.get("mock_ui", []), card.get("footer", "こんなサイトあったら便利？"))
    svg_path = OUTPUT_DIR / "card_images" / f"{today_iso()}.svg"
    html_path = OUTPUT_DIR / "card_images" / f"{today_iso()}.html"
    write_text(svg_path, svg)
    write_text(html_path, html_doc)
    payload = department_output(
        "Design Department",
        "1080x1350のカード画像素材をHTML/SVGで生成しました。",
        scores={"width": 1080, "height": 1350},
        risks=["png_screenshot_requires_optional_playwright"] if not (OUTPUT_DIR / "card_images" / f"{today_iso()}.png").exists() else [],
        next_action="risk gate",
        input_sources=["output/reports/llm_council.json", "output/reports/design_strategy.json"],
        extra={
            "card_paths": [str(svg_path.relative_to(OUTPUT_DIR.parent)), str(html_path.relative_to(OUTPUT_DIR.parent))],
            "design_strategy": {
                "visual_positioning": design_strategy.get("visual_positioning", ""),
                "ui_metaphor": design_strategy.get("ui_metaphor", []),
                "color_direction": design_strategy.get("color_direction", []),
                "must_show_fields": design_strategy.get("must_show_fields", []),
                "card_cta": design_strategy.get("card_cta", ""),
            },
        },
    )
    save_stage("card_image.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Generate card image assets").parse_args()
    run(sample=args.sample)
