export async function loadHackerNewsTopics({ config }) {
  if (!config.sources.hackerNews.enabled) return [];
  const topics = [];

  for (const query of config.sources.hackerNews.queries) {
    const url = new URL("https://hn.algolia.com/api/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("tags", "story");
    url.searchParams.set("hitsPerPage", String(config.sources.hackerNews.limitPerQuery));

    try {
      const response = await fetchWithTimeout(url, 8000);
      if (!response.ok) continue;
      const payload = await response.json();
      for (const hit of payload.hits ?? []) {
        const title = String(hit.title ?? hit.story_title ?? "").trim();
        if (!title) continue;
        topics.push({
          source: "hackernews",
          theme: titleToTheme(title),
          keywords: extractKeywords(title),
        });
      }
    } catch {
      continue;
    }
  }

  return topics;
}

function titleToTheme(title) {
  return title.toLowerCase().replace(/[^\w\s-]/g, "").slice(0, 120);
}

function extractKeywords(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .slice(0, 8);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
