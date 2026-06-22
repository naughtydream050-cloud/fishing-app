# Public Market Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a daily public-source market research layer before niche candidate scoring.

**Architecture:** Fetch a small curated set of public RSS/HTML sources without secrets, normalize text into signals, extract niche app needs, merge with manual seeds, and expose source freshness/audit metadata through post_source_audit. Posting remains blocked when evidence, source URLs, or selected candidate are missing.

**Tech Stack:** Python standard library, GitHub Actions, existing Niche App Signal OS report/memory JSON conventions.

---

### Task 1: Public Source Configuration

**Files:**
- Create: `data/market_research_sources.json`

- [ ] Add a small curated list of public RSS/HTML sources with source type, URL, and niche hints.

### Task 2: Fetch Public Market Sources

**Files:**
- Create: `scripts/fetch_public_market_sources.py`

- [ ] Fetch configured public sources with urllib, normalize title/summary/url/source_type, and write `raw_market_signals.json` plus markdown memory.

### Task 3: Extract Market Needs

**Files:**
- Create: `scripts/extract_market_needs.py`
- Modify: `scripts/collect_research_inputs.py`

- [ ] Convert raw public signals into candidate-shaped research inputs.
- [ ] Preserve source_urls, source_types, evidence_count, research_freshness, fallback_reason.
- [ ] Fallback to manual candidates only with explicit `fallback_with_reason`.

### Task 4: Audit and Duplicate Hardening

**Files:**
- Modify: `scripts/score_niche_demand.py`
- Modify: `scripts/select_niche_candidate.py`
- Modify: `scripts/build_market_research_trace.py`
- Modify: `scripts/post_source_audit.py`

- [ ] Carry source metadata through scoring, selection, trace, and audit.
- [ ] Block evidence_count=0, selected_candidate=null, source_urls=[].
- [ ] Include source_urls hash and pain_point in duplicate guard.

### Task 5: Pipeline and Validation

**Files:**
- Modify: `scripts/run_daily_pipeline.py`
- Generate: dry-run outputs

- [ ] Insert public source fetch and extraction before collect_research_inputs.
- [ ] Run dry-run through GitHub Actions or local where available.
- [ ] Verify no live post, no secrets, no external API keys.
