# GPT Consultation Protocol

## Purpose

Codex may consult the user's already-open ChatGPT screen for planning, judgment, implementation direction, and verification direction. Codex still owns local implementation and verification.

## Never Send

- API keys, service role keys, tokens, secrets
- Email addresses
- Personal information
- Raw user worries, private text, or sensitive inputs
- Large logs or full source files
- Existing production data

## Consultation Shape

Use short packets only:

```text
今、PROJECTでTASKを実装中です。秘密情報は共有しません。
現在の状況はA、問題はB、候補はC/Dです。
MVPとして安全に進めるならどちらがよいか、実装順と注意点を短く提案してください。
```

## Preferred Route

1. Try `tool_search` for Browser / node_repl / Chrome operation tools.
2. If trusted Browser MCP is exposed, use it.
3. If Browser MCP is not exposed, inspect named pipes matching `codex-browser-use*`.
4. Use only read-only calls until the target tab and composer are confirmed.
5. Ask the user before sending.

## Named Pipe Notes

Observed on 2026-06-04:

- Pipe framing uses a 4-byte little-endian length prefix followed by UTF-8 JSON.
- Requests require `session_id` and `turn_id`.
- Current metadata can be extracted from the latest rollout JSONL `session_meta` and `turn_context`.
- Chrome pipe supported `getInfo`, `getUserTabs`, `claimUserTab`, and `getTabs`.
- In-app browser pipe supported `getInfo` and `getTabs`.

## Safe Minimum Test

1. `getInfo`
2. `getUserTabs` or `getTabs`
3. Identify only the intended `chatgpt.com` / project chat tab.
4. `claimUserTab` only for the intended tab.
5. Detect input/composer without typing.
6. Stop and ask for send approval.

## Current 2026-06-04 Status

- Chrome target tab was visible: `Codexで月1万円獲得`.
- Chrome tab claim succeeded.
- Direct `executeCdp` still failed with `Debugger is not attached`.
- In-app browser was reachable but only had `about:blank`.
- Therefore actual message send remains gated by user approval and a working composer detection path.

## Fallback

If composer detection or sending cannot be safely verified:

1. Write the packet to `docs/CONSULT_GPT.md`.
2. Include the packet in the Result Card.
3. Continue only with local DRY_RUN-safe work.
