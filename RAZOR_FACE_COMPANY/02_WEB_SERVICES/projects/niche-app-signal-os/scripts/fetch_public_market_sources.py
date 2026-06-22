from __future__ import annotations

import html
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

from common import DATA_DIR, MEMORY_DIR, OUTPUT_DIR, cli_parser, department_output, ensure_dirs, read_json, save_stage, today_iso, write_json, write_text


USER_AGENT = "NicheAppSignalOS/1.0 (+public-source-research; no-secrets)"


def _fetch(url: str) -> tuple[str, str]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        content_type = response.headers.get("content-type", "")
        charset_match = re.search(r"charset=([\w-]+)", content_type, re.I)
        charset = charset_match.group(1) if charset_match else "utf-8"
        body = response.read().decode(charset, errors="replace")
        return body, content_type


def _strip(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def _rss_items(body: str, source: dict) -> list[dict]:
    root = ET.fromstring(body)
    items = []
    for node in root.findall(".//item")[:25]:
        title = _strip(node.findtext("title") or "")
        summary = _strip(node.findtext("description") or "")
        link = _strip(node.findtext("link") or "")
        published_at = _strip(node.findtext("pubDate") or node.findtext("{http://purl.org/dc/elements/1.1/}date") or "")
        if not title and not summary:
            continue
        items.append(
            {
                "source_id": source.get("source_id", ""),
                "source_type": source.get("source_type", "public_rss"),
                "source_url": source.get("url", ""),
                "item_url": link or source.get("url", ""),
                "title": title,
                "summary": summary,
                "published_at": published_at,
                "audience_hint": source.get("audience_hint", ""),
                "niche_hints": source.get("niche_hints", []),
            }
        )
    return items


def _html_items(body: str, source: dict) -> list[dict]:
    title = _strip(re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S).group(1)) if re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S) else ""
    description_match = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', body, re.I | re.S)
    summary = _strip(description_match.group(1)) if description_match else ""
    if not title and not summary:
        return []
    return [
        {
            "source_id": source.get("source_id", ""),
            "source_type": source.get("source_type", "public_html"),
            "source_url": source.get("url", ""),
            "item_url": source.get("url", ""),
            "title": title,
            "summary": summary,
            "published_at": "",
            "audience_hint": source.get("audience_hint", ""),
            "niche_hints": source.get("niche_hints", []),
        }
    ]


def run(sample: bool = False) -> dict:
    ensure_dirs()
    config = read_json(DATA_DIR / "market_research_sources.json", {"sources": []})
    sources = config.get("sources", []) if isinstance(config, dict) else []
    signals: list[dict] = []
    errors: list[dict] = []

    for source in sources:
        url = str(source.get("url", "")).strip()
        if not url:
            errors.append({"source_id": source.get("source_id", ""), "error": "missing_url"})
            continue
        try:
            body, content_type = _fetch(url)
            if "xml" in content_type.lower() or body.lstrip().startswith("<?xml") or "<rss" in body[:300].lower():
                items = _rss_items(body, source)
            else:
                items = _html_items(body, source)
            signals.extend(items)
        except (urllib.error.URLError, TimeoutError, ET.ParseError, UnicodeError) as exc:
            errors.append({"source_id": source.get("source_id", ""), "url": url, "error": str(exc)[:300]})

    freshness = "fresh" if signals else "stale_blocked"
    fallback_reason = "" if signals else "public source fetch returned no usable market signals"
    payload = department_output(
        "Public Market Research Department",
        "Fetched small curated public market sources and normalized them into raw market signals.",
        scores={"source_count": len(sources), "signal_count": len(signals), "error_count": len(errors)},
        risks=[] if signals else ["no_public_market_signals"],
        next_action="extract market needs" if signals else "fallback or stop",
        input_sources=["data/market_research_sources.json"],
        extra={
            "research_freshness": freshness,
            "fallback_reason": fallback_reason,
            "signals": signals,
            "errors": errors,
            "source_urls": [source.get("url", "") for source in sources if source.get("url")],
            "source_types": sorted({source.get("source_type", "") for source in sources if source.get("source_type")}),
        },
    )
    write_json(OUTPUT_DIR / "reports" / "raw_market_signals.json", payload)
    write_json(OUTPUT_DIR / "reports" / "public_market_research.json", payload)
    write_text(
        OUTPUT_DIR / "reports" / "public_market_research.md",
        "\n".join(
            [
                f"# Public Market Research - {today_iso()}",
                "",
                f"- research_freshness: {freshness}",
                f"- signal_count: {len(signals)}",
                f"- error_count: {len(errors)}",
                f"- fallback_reason: {fallback_reason}",
                "",
                "## Signals",
                *[f"- [{item['source_id']}] {item['title'][:120]} ({item['item_url']})" for item in signals[:20]],
                "",
            ]
        ),
    )
    write_text(
        MEMORY_DIR / "market_research" / f"{today_iso()}.md",
        "\n".join(
            [
                f"# Public Market Research Memory - {today_iso()}",
                "",
                f"- freshness: {freshness}",
                f"- signals: {len(signals)}",
                f"- fallback_reason: {fallback_reason}",
                "",
                *[f"- {item['title'][:160]} / {item['item_url']}" for item in signals[:25]],
                "",
            ]
        ),
    )
    save_stage("public_market_research_stage.json", payload)
    return payload


if __name__ == "__main__":
    args = cli_parser("Fetch public market research sources").parse_args()
    run(sample=args.sample)
