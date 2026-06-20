# Harness Audience Design Loop

Date: 2026-06-18

## Purpose

Niche App Signal OS should not optimize for posting volume. It should optimize for demand validation precision:

1. Find a niche pain.
2. Identify the audience segment.
3. Decide the words and visual tone that make the idea feel personal.
4. Generate DRY_RUN copy and UI cards.
5. Feed manual reactions back into Memory.
6. Select Web, note, or SaaS candidates from evidence.

## New Departments

### Audience Strategy Department

Script: `scripts/audience_strategy.py`

Runs after `score_niche_demand.py`.

Outputs:

- `output/reports/audience_strategy.json`
- `memory/audience/YYYY-MM-DD.md`

Responsibilities:

- Define the target user segment.
- Identify user motivation and current alternatives.
- List words to use and words to avoid.
- Provide comment hooks for manual validation.

### Design Intelligence Department

Script: `scripts/design_intelligence.py`

Runs after `run_llm_council.py` and before card generation.

Outputs:

- `output/reports/design_strategy.json`
- `memory/design_strategy/YYYY-MM-DD.md`

Responsibilities:

- Convert audience strategy into a UI direction.
- Define UI metaphor, color direction, composition, and must-show fields.
- Prevent generic, sterile, or wrong-audience visuals.

### Reaction Memory Department

Script: `scripts/update_reaction_memory.py`

Runs after manual/DRY_RUN publishing stages.

Outputs:

- `data/reaction_memory.json`
- `output/reports/reaction_memory.json`
- `memory/reaction/YYYY-MM-DD.md`

Responsibilities:

- Hold manual post reactions without calling Threads APIs.
- Track likes, replies, saves, objections, requested fields, and design feedback.
- Provide evidence for Web/note/SaaS candidate decisions.

## Updated Flow

```text
Research
↓
Viral Pattern
↓
Memory
↓
Trend Timing
↓
Planning / Niche Demand Score
↓
Audience Strategy
↓
LLM Council
↓
Design Intelligence
↓
Copywriting
↓
Design / UI Card
↓
Risk Control
↓
DRY_RUN Publishing
↓
Reaction Memory
↓
Executive / Candidate Scoring
```

## Design Rule

Every generated UI card should answer this before visual work starts:

- Who is this for?
- What do they already use instead?
- What words make it feel like their problem?
- What visual metaphor makes it feel desirable?
- What visual choices would make it feel wrong?

For `oshi-activity-management`, the winning pattern is:

```text
推し活の記憶を、現場ごとにかわいく見返せるログ
```

Recommended visual method:

```text
推し色パステル × チケット半券/手帳メタファー × 実装できそうなスマホUI
```

Avoid:

```text
管理SaaS風 / 家計簿風 / 業務ダッシュボード風 / 完全自動化の訴求
```

## Safety

- DRY_RUN remains true.
- AUTO_POST remains false.
- No Threads real posting.
- No external API added.
- No DB/Auth/payment/RLS added.
- No secrets required.
