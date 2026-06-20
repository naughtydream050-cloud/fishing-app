# Feedback Checklist - Oshi Activity Management

Date: 2026-06-06

## What To Look For

Use this checklist when reviewing owner/GPT comments, DRY_RUN reactions, or manual feedback.

## Pain Signals

- Mentions that information is split across calendar, notes, screenshots, photos, DMs, and payment history.
- Mentions wanting to look back by event/現場 rather than by date.
- Mentions forgetting seat, setlist, MC, goods, or travel details.

## Feature Signals

Strong:

- ticket_status
- companion
- emotion_tag
- payment_due_date
- goods duplicate count
- travel total by event

Medium:

- photo attachment
- reminder
- export CSV
- yearly total
- exchange/trade memo

Not for this MVP yet:

- cloud sync
- account login
- ticket-site integration
- payment integration
- public sharing

## Copy Signal Review

For each DRY_RUN post variant, score:

- Concrete comments: 0-3
- Saves/bookmark intent: 0-3
- Prototype requests: 0-3
- Missing-field requests: 0-3
- Risk/confusion: 0-3

Recommended next action:

- A wins: write note and LP around "現場ごとに散らかる情報".
- B wins: add stronger travel/goods summaries before LP.
- C wins: add `emotion_tag` and memory-forward copy before LP.

## MVP Field Decision

Add fields only when at least two independent signals mention the same need.

Current GPT-suggested candidates:

- `ticket_status`
- `companion`
- `emotion_tag`

## Safety Review Before Any Public Use

- Confirm `DRY_RUN=true`.
- Confirm `AUTO_POST=false`.
- Confirm no Threads API call will run.
- Remove screenshots with personal data.
- Remove ticket IDs, emails, payment details, names, and private notes.
- Owner approval required before publishing.
