# Agent: Post Checker

Task:
Score each draft against content_rules.md.

Score:
- 10: auto-approve
- 9 or lower: reject or regenerate

Checklist:
- SPEC AI relevance
- original wording
- one concrete idea
- useful without click
- no hype-only claim
- no duplicate structure
- no spam signal
- X-readable
- CTA/link policy respected
- product facts correct

Output:
{
  "draftId": "id",
  "score": 10,
  "decision": "approve",
  "reasons": []
}
