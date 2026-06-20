# GPT Consultation Packet - Next DRY_RUN Review

Task:
Codex should continue Niche App Signal OS after 7-day DRY_RUN generation by adding an offline review step.

Context:
- Secrets, API keys, emails, personal information, and raw user data are not shared.
- AUTO_POST=false and DRY_RUN=true must stay.
- Threads real posting is prohibited.
- Existing output has 7 days of post drafts, card assets, Memory notes, Council notes, weekly report, candidates, and preflight audit.
- Current browser consultation route failed with `No Codex browser route is available`, so this packet is saved locally.

Options:
A. Add a small offline editorial review script that ranks categories, chooses keep/reduce categories, and selects Web/note candidates from existing DRY_RUN artifacts.
B. Redesign the whole pipeline before review.

Risk:
- Scope creep if redesign starts now.
- Accidental AUTO_POST or Threads API changes if review is mixed with publishing.
- Weak operational handoff if no review summary exists.

Recommended:
A. Keep the pipeline, add offline review artifacts only, and do not touch posting.

Question:
For MVP safety, should Codex add the offline review step now and keep AUTO_POST=false?
