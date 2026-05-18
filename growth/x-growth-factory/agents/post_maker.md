# Agent: Post Maker

Task:
Generate original SPEC AI posts from approved patterns.

Inputs:
- product.yaml
- content_rules.md
- approved pattern
- recent posting_log.json

Rules:
- one idea per post
- useful without clicking
- link only when link quota allows
- no duplicate structure from previous day
- no copied text
- no fake claims

Output JSON:
{
  "id": "draft-id",
  "date": "YYYY-MM-DD",
  "pattern": "pattern-name",
  "post": "text",
  "hasLink": false,
  "targetKpi": "freeUses",
  "model": "local_or_free_tier"
}
