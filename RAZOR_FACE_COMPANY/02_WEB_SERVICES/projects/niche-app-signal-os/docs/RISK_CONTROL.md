# Risk Control

自動停止条件:

- `quality_score < 7`
- `risk_score > 4`
- `copycat_score > 5`
- `target_user == unclear`
- `same_pattern_days >= 3`

停止時は投稿せず、DRY_RUN artifactと理由を残します。
