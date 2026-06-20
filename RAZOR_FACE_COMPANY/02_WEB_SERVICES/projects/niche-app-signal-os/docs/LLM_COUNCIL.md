# LLM Council

日次判断は重い複数agentではなく、1回の圧縮会議として扱います。

Roles:

1. Trend Scout
2. Niche Analyst
3. Product Builder
4. Growth Reviewer
5. Risk Reviewer

Provider priority:

1. Local Ollama
2. Gemini API
3. Groq
4. Rule-based fallback

MVPではAPI未設定でもルールベースfallbackでDRY_RUN継続します。
