# Chrome Consult Route Recovery

## Test Date

2026-06-04

## Current Result

Existing Chrome and the target window are present, but this Codex turn does not expose the trusted browser operation tool needed to claim and control the existing ChatGPT tab.

No message was sent. No login, password, 2FA, secret, AUTO_POST, Threads API, or external posting was attempted.

Update: direct named-pipe probing later confirmed that a Chrome pipe can be used for read-only tab discovery and `claimUserTab` when current `session_id` and `turn_id` are supplied. It still did not complete `Runtime.evaluate` because the debugger was not attached.

## Checked

- Chrome process: running
- Target window title: `Codexで月1万円獲得 - Google Chrome`
- Chrome plugin config: enabled in `C:\Users\razor\.codex\config.toml`
- Codex Chrome Extension: installed, registered, enabled
- Native host manifest: correct
- Chrome CDP `127.0.0.1:9222`: unavailable
- Python `playwright`: unavailable
- Python `browser_use`: unavailable
- Python `selenium`: unavailable
- Node `playwright`: unavailable
- Node `puppeteer`: unavailable
- Node `chrome-remote-interface`: unavailable
- Local `browser-client.mjs`: present, but direct Node use fails with trusted bridge unavailable
- Browser allowed origin includes `https://chatgpt.com`
- Named pipe framing: 4-byte little-endian length prefix + UTF-8 JSON
- Chrome named pipe: `getInfo`, `getUserTabs`, `claimUserTab`, and `getTabs` worked
- In-app browser named pipe: `getInfo` and `getTabs` worked
- Chrome `executeCdp Runtime.evaluate`: blocked by `Debugger is not attached`
- In-app browser current tab: `about:blank`, no ChatGPT page at test time

## Cause Candidates

1. The Browser/Chrome plugins are installed, but the current Codex turn did not expose the trusted Node REPL/browser-client MCP tool.
2. `browser-client.mjs` cannot be used from arbitrary shell Node because it requires the privileged native pipe bridge.
3. The currently running Chrome was not started with `--remote-debugging-port=9222`, so generic CDP clients cannot attach.
4. Python and Node automation packages are not installed in this project/runtime.

## Recovery Path

Preferred route:

1. Start a fresh Codex turn explicitly invoking the Chrome plugin, for example `[@chrome](plugin://chrome@openai-bundled) 既存ChatGPTタブを一覧表示して、送信せず入力欄検出まで確認して`.
2. Confirm the callable tool includes a Node REPL JavaScript executor such as `mcp__node_repl__js`.
3. Use the Chrome skill flow:
   - initialize `browser-client.mjs` inside the trusted Node REPL
   - list open user tabs
   - claim only the visible `Codexで月1万円獲得` / `chatgpt.com` tab
   - detect the ChatGPT composer
   - stop before sending
4. Ask for explicit user approval before sending any test message.

Direct named-pipe route:

1. Extract the latest `session_id` from `session_meta` and `turn_id` from `turn_context`.
2. Enumerate `\\.\pipe\codex-browser-use*`.
3. Use 4-byte length-prefixed JSON-RPC.
4. Call `getInfo`, then `getUserTabs`.
5. Only claim the intended `chatgpt.com` project tab.
6. Stop if CDP attach or composer detection is not confirmed.

Fallback route:

1. Keep using `docs/CONSULT_GPT.md`.
2. Put the exact consultation packet there.
3. Report the packet in the Result Card.
4. Wait for the user to paste the GPT response back into Codex.

CDP route:

Only use this if the user explicitly approves restarting Chrome:

1. Close or fully exit Chrome after the user confirms tabs are safe.
2. Launch Chrome with a remote debugging port and the same profile.
3. Verify `http://127.0.0.1:9222/json/version`.
4. Use Playwright/Puppeteer/CDP only to inspect the existing ChatGPT input area.
5. Stop before sending unless the user approves.

## Minimal Safe Test

When a trusted browser operation tool is available:

1. List open tabs.
2. Identify one matching `chatgpt.com` and `Codexで月1万円獲得`.
3. Claim that tab.
4. Detect a visible composer/input field.
5. Do not type or send.
6. Return a Result Card.
