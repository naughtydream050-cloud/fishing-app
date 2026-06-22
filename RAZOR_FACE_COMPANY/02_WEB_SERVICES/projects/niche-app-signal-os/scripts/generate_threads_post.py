from __future__ import annotations

import hashlib
import re
from collections.abc import Callable

from common import DATA_DIR, OUTPUT_DIR, cli_parser, department_output, load_latest, read_json, save_stage, today_iso, write_json, write_text


COPY_DECKS = {
    "receipt-payment-lookback": {
        "thing": "レシート",
        "problem_name": "支払い履歴探し",
        "audience_word": "ネットで買い物する人",
        "places": ["写真フォルダ", "カード明細", "ECの購入履歴", "コンビニの紙レシート"],
        "pain_scene": "返品したい時とか、保証を見たい時",
        "bad_result": "見つけた頃には、もう探す気力がなくなる",
        "app_idea": "買ったものごとにレシート写真と支払い履歴だけまとまってるアプリ",
        "screen_idea": "購入ごとの証跡ログ",
        "not_goal": "家計簿をちゃんと続けたい",
        "current_tool": "写真フォルダ",
        "cta_alt": "家計簿アプリ",
    },
    "student-deadline-check": {
        "thing": "提出物",
        "problem_name": "締切探し",
        "audience_word": "学生",
        "places": ["学校ポータル", "LINE", "授業プリント", "カレンダー"],
        "pain_scene": "前日の夜とか朝の支度中",
        "bad_result": "結局どれが最新か分からなくなる",
        "app_idea": "授業ごとに締切・提出先・持ち物だけまとまるアプリ",
        "screen_idea": "時間割ごとの提出物ボード",
        "not_goal": "勉強管理を完璧にしたい",
        "current_tool": "学校ポータル",
        "cta_alt": "今のメモ",
    },
    "live-trip-packing-check": {
        "thing": "遠征の持ち物",
        "problem_name": "現場前チェック",
        "audience_word": "ライブ遠征する人",
        "places": ["チケットのスクショ", "スマホメモ", "財布の中", "前回の持ち物リスト"],
        "pain_scene": "出発前に荷物を閉じる瞬間",
        "bad_result": "何回確認しても、なんか忘れてる気がする",
        "app_idea": "現場ごとに持ち物と前回の忘れ物だけ残せるアプリ",
        "screen_idea": "現場前チェックボード",
        "not_goal": "旅行準備をきれいに管理したい",
        "current_tool": "スマホメモ",
        "cta_alt": "Notion",
    },
    "goods-stock-log": {
        "thing": "グッズ",
        "problem_name": "所持数探し",
        "audience_word": "グッズ交換する人",
        "places": ["写真フォルダ", "スマホメモ", "交換DM", "保管用ポーチ"],
        "pain_scene": "現場で交換する前",
        "bad_result": "持ってる数も交換予定もあいまいになる",
        "app_idea": "写真つきで所持数と交換予定だけ見れるアプリ",
        "screen_idea": "持ち出し用のグッズ棚",
        "not_goal": "在庫管理をちゃんとしたい",
        "current_tool": "写真フォルダ",
        "cta_alt": "スプレッドシート",
    },
    "subscription-overlap-check": {
        "thing": "サブスク",
        "problem_name": "月額見直し",
        "audience_word": "サブスクが増えがちな人",
        "places": ["カード明細", "アプリの契約画面", "メール", "カレンダー"],
        "pain_scene": "月末に明細を見た時",
        "bad_result": "何に払ってるか分からないまま来月も続く",
        "app_idea": "更新日と使ってる感だけ見えるサブスク棚アプリ",
        "screen_idea": "月額サービスの更新カード",
        "not_goal": "家計管理を完璧にしたい",
        "current_tool": "カード明細",
        "cta_alt": "家計簿アプリ",
    },
}


def _selected_candidate() -> dict:
    pack = load_latest("daily_niche_ui_candidates.json", {})
    selected_id = pack.get("selected_candidate_id", "")
    for candidate in pack.get("candidates", []):
        if candidate.get("candidate_id") == selected_id:
            return candidate
    return {}


def _deck(candidate: dict) -> dict:
    candidate_id = candidate.get("candidate_id", "")
    aliases = {
        "receipt-payment-retrace": "receipt-payment-lookback",
        "student-deadline-check": "student-deadline-check",
        "trip-packing-last-check": "live-trip-packing-check",
        "oshi-goods-inventory": "goods-stock-log",
        "subscription-renewal-snapshot": "subscription-overlap-check",
    }
    candidate_id = aliases.get(candidate_id, candidate_id)
    if candidate_id in COPY_DECKS:
        return COPY_DECKS[candidate_id]
    return {
        "thing": candidate.get("category", "これ"),
        "problem_name": candidate.get("category", "小さい不便"),
        "audience_word": candidate.get("target_user", "使う人"),
        "places": [part.strip() for part in candidate.get("current_workaround", "").replace("、", ",").split(",") if part.strip()][:4] or ["メモ", "スクショ", "カレンダー", "写真フォルダ"],
        "pain_scene": "あとで見返したい時",
        "bad_result": candidate.get("pain_point", "必要な情報が見つかりにくい"),
        "app_idea": f"{candidate.get('expected_ui_metaphor', 'スマホUI')}のアプリ",
        "screen_idea": candidate.get("expected_ui_metaphor", "スマホログ"),
        "not_goal": "きれいに管理したい",
        "current_tool": "スマホメモ",
        "cta_alt": "今のやり方",
    }


def _join_places(deck: dict, prefix: str = "") -> list[str]:
    return [f"{prefix}{place}" for place in deck["places"][:4]]


def _pattern_01(deck: dict) -> str:
    return "\n".join([
        f"{deck['thing']}探すの、毎回ちょっと負けてる気がする。",
        "",
        *_join_places(deck, ""),
        "",
        f"{deck['bad_result']}やつ。",
        "",
        f"{deck['app_idea']}あったら普通に使う？",
    ])


def _pattern_02(deck: dict) -> str:
    return "\n".join([
        f"「{deck['thing']}どこだっけ」ってなってからが長い。",
        "",
        f"{deck['places'][0]}見て、{deck['places'][1]}見て、",
        f"結局{deck['places'][2]}まで戻る。",
        "",
        f"{deck['pain_scene']}にこれやるの、地味にしんどい。",
        "",
        f"{deck['screen_idea']}だけ開けば済むなら欲しい？",
    ])


def _pattern_03(deck: dict) -> str:
    return "\n".join([
        f"{deck['not_goal']}わけじゃないんよ。",
        "",
        f"ただ、{deck['pain_scene']}に",
        f"{deck['thing']}がすぐ出てきてほしいだけ。",
        "",
        f"{deck['current_tool']}に置いた気もするし、",
        f"{deck['places'][-1]}に残した気もする。",
        "",
        f"こういうのだけ拾ってくれる{deck['screen_idea']}、需要ある？",
    ])


def _pattern_04(deck: dict) -> str:
    return "\n".join([
        f"{deck['audience_word']}、これ一回はあると思う。",
        "",
        f"{deck['thing']}を探す",
        "見つからない",
        "別のアプリを開く",
        "また戻る",
        "",
        f"で、{deck['bad_result']}。",
        "",
        f"{deck['app_idea']}、使う？",
    ])


def _pattern_05(deck: dict) -> str:
    return "\n".join([
        f"{deck['thing']}、あるのは分かってるのに見つからないのが一番だるい。",
        "",
        f"{deck['places'][0]}にはありそう",
        f"{deck['places'][1]}にもありそう",
        f"{deck['places'][2]}にもありそう",
        "",
        "でも今ほしいのはそこじゃなくて、",
        "一発で出てくる画面。",
        "",
        f"{deck['screen_idea']}みたいなの、実際使う？",
    ])


def _pattern_06(deck: dict) -> str:
    return "\n".join([
        f"{deck['pain_scene']}、{deck['problem_name']}で時間溶けない？",
        "",
        "ちゃんと残してるはずなのに、",
        "残し場所が毎回違う。",
        "",
        *_join_places(deck, "・"),
        "",
        f"{deck['app_idea']}があったら、今のやり方から乗り換える？",
    ])


def _pattern_07(deck: dict) -> str:
    return "\n".join([
        "ほしいのは多機能アプリじゃなくて、",
        f"「{deck['thing']}どこ？」にだけ強い画面かもしれない。",
        "",
        f"{deck['places'][0]}",
        f"{deck['places'][1]}",
        f"{deck['places'][2]}",
        "",
        f"このへんを横断して、{deck['screen_idea']}にまとまってたら助かる？",
    ])


def _pattern_08(deck: dict) -> str:
    return "\n".join([
        f"{deck['thing']}、探してる時点でもうちょっと負けてる。",
        "",
        f"{deck['pain_scene']}に",
        f"{deck['places'][0]}から探し始めて、",
        f"{deck['places'][1]}まで見に行く流れ。",
        "",
        f"{deck['bad_result']}の、かなりあるあるだと思う。",
        "",
        f"{deck['app_idea']}なら使う？",
    ])


def _pattern_09(deck: dict) -> str:
    return "\n".join([
        f"もし{deck['screen_idea']}があるなら、画面はこれくらいでいい。",
        "",
        f"{deck['thing']}",
        "日付",
        "場所",
        "あとで見返すメモ",
        "",
        "余計な分析とかはいらない。",
        f"{deck['pain_scene']}に迷わず開けるやつ。",
        "",
        "こういう割り切ったアプリ、あり？",
    ])


def _pattern_10(deck: dict) -> str:
    return "\n".join([
        f"{deck['cta_alt']}で十分って分かってるんだけど、",
        f"{deck['problem_name']}だけは専用画面が欲しくなる時ある。",
        "",
        f"{deck['places'][0]}",
        f"{deck['places'][1]}",
        f"{deck['places'][2]}",
        "",
        f"このへんに散らばった{deck['thing']}を、",
        f"一つの{deck['screen_idea']}で見返せたらどう？",
    ])


PATTERNS: list[tuple[str, Callable[[dict], str]]] = [
    ("small_loss_confession", _pattern_01),
    ("quote_search_loop", _pattern_02),
    ("not_management_just_need", _pattern_03),
    ("everyone_has_done_this", _pattern_04),
    ("exists_but_missing", _pattern_05),
    ("time_melts_scene", _pattern_06),
    ("single_purpose_screen", _pattern_07),
    ("searching_is_defeat", _pattern_08),
    ("screen_requirements", _pattern_09),
    ("alternative_is_ok_but", _pattern_10),
]


def _recent_post_texts(limit: int = 12) -> list[str]:
    raw = read_json(DATA_DIR / "post_log.json", [])
    if not isinstance(raw, list):
        return []
    texts = [entry.get("post_text", "") for entry in raw if isinstance(entry, dict) and entry.get("post_text")]
    return texts[-limit:]


def _fingerprint(text: str) -> set[str]:
    normalized = re.sub(r"\s+", "", text)
    return {normalized[i : i + 3] for i in range(max(0, len(normalized) - 2))}


def _similarity(a: str, b: str) -> float:
    left = _fingerprint(a)
    right = _fingerprint(b)
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def _variant_order(candidate: dict) -> list[tuple[str, Callable[[dict], str]]]:
    seed = f"{today_iso()}:{candidate.get('candidate_id', '')}"
    start = int(hashlib.sha256(seed.encode("utf-8")).hexdigest()[:4], 16) % len(PATTERNS)
    return PATTERNS[start:] + PATTERNS[:start]


def _tone_check(text: str, profile: dict, recent_texts: list[str]) -> dict:
    avoid_words = profile.get("avoid_words") or []
    use_words = profile.get("use_words") or []
    used_avoid = [word for word in avoid_words if word and word in text]
    used_words = [word for word in use_words if word and word in text]
    max_recent_similarity = max([_similarity(text, recent) for recent in recent_texts] or [0.0])
    passed = not used_avoid and bool(text.strip()) and max_recent_similarity < 0.46
    return {
        "passed": passed,
        "tone_id": profile.get("tone_id", ""),
        "used_words": used_words,
        "used_avoid_words": used_avoid,
        "line_count": len([line for line in text.splitlines() if line.strip()]),
        "target_audience": profile.get("target_audience", ""),
        "max_recent_similarity": round(max_recent_similarity, 3),
    }


def run(sample: bool = False) -> dict:
    profile = load_latest("audience_tone_profile.json", {}).get("audience_tone_profile", {})
    candidate = _selected_candidate()
    deck = _deck(candidate)
    recent_texts = _recent_post_texts()
    variants = []
    for index, (pattern_id, builder) in enumerate(_variant_order(candidate), start=1):
        text = builder(deck)
        variants.append(
            {
                "variant_id": f"{index:02d}",
                "candidate_id": candidate.get("candidate_id", ""),
                "angle": pattern_id,
                "text": text,
                "tone_id": profile.get("tone_id", ""),
                "tone_check_result": _tone_check(text, profile, recent_texts),
                "length": len(text),
            }
        )
    passed = [variant for variant in variants if variant["tone_check_result"]["passed"]]
    selected = passed[0] if passed else variants[0]

    variants_payload = {
        "date": today_iso(),
        "candidate_id": candidate.get("candidate_id", ""),
        "tone_id": profile.get("tone_id", ""),
        "target_audience": profile.get("target_audience", ""),
        "selected_variant_id": selected["variant_id"],
        "selected_pattern_id": selected["angle"],
        "variant_count": len(variants),
        "variants": variants,
        "all_variants_tone_checked": True,
        "selection_rule": "first tone-passing pattern after date/candidate rotation, with recent similarity below threshold",
    }
    write_json(OUTPUT_DIR / "reports" / "threads_tone_variants.json", variants_payload)

    post = {
        "date": today_iso(),
        "candidate_id": candidate.get("candidate_id", ""),
        "text": selected["text"],
        "alt_text": f"{candidate.get('category', '候補')}のスマホアプリ画面",
        "topic_tags": [candidate.get("category", ""), "ニッチアプリ"],
        "decision": "dry_run",
        "tone_id": profile.get("tone_id", ""),
        "target_audience": profile.get("target_audience", ""),
        "variant_id": selected["variant_id"],
        "pattern_id": selected["angle"],
        "tone_check_result": selected["tone_check_result"],
    }
    payload = department_output(
        "Scriptwriter Department",
        "Generated natural Threads copy from 10 rotating audience-aware structures instead of a single fixed template.",
        scores={"length": len(selected["text"]), "variant_count": len(variants), "max_recent_similarity": selected["tone_check_result"]["max_recent_similarity"]},
        risks=[] if selected["tone_check_result"]["passed"] else ["no_low_similarity_variant_available"],
        next_action="generate mobile UI share card",
        input_sources=["output/reports/daily_niche_ui_candidates.json", "output/reports/audience_tone_profile.json", "data/post_log.json"],
        extra={"post": post, "tone_variants_path": "output/reports/threads_tone_variants.json"},
    )
    save_stage("threads_post.json", payload)
    write_text(OUTPUT_DIR / "thread_posts" / f"{today_iso()}.md", selected["text"] + "\n")
    return payload


if __name__ == "__main__":
    args = cli_parser("Generate audience-aware Threads post copy").parse_args()
    run(sample=args.sample)
