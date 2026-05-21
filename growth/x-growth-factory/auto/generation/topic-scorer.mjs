export function scoreTopics(topics, config, patternMemory) {
  return dedupeThemes(topics)
    .map((topic) => ({
      ...topic,
      score: scoreTopic(topic, config, patternMemory),
    }))
    .sort((a, b) => b.score - a.score);
}

function scoreTopic(topic, config, patternMemory) {
  const text = `${topic.theme} ${(topic.keywords ?? []).join(" ")}`.toLowerCase();
  let score = 0;

  for (const [keyword, weight] of Object.entries(config.scoringWeights)) {
    if (text.includes(keyword)) score += weight;
  }

  for (const pattern of patternMemory.preferredThemes ?? []) {
    if (text.includes(String(pattern).toLowerCase())) score += 3;
  }

  for (const pattern of patternMemory.weakThemes ?? []) {
    if (text.includes(String(pattern).toLowerCase())) score -= 4;
  }

  return score;
}

function dedupeThemes(topics) {
  const seen = new Set();
  return topics.filter((topic) => {
    const key = String(topic.theme ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
