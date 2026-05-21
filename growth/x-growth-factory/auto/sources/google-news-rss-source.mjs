export async function loadGoogleNewsRssTopics({ config }) {
  if (!config.sources.googleNewsRss.enabled) return [];
  const topics = [];

  for (const query of config.sources.googleNewsRss.queries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const response = await fetchWithTimeout(url, 8000);
      if (!response.ok) continue;
      const xml = await response.text();
      topics.push(...extractRssTitles(xml, "google-news"));
    } catch {
      continue;
    }
  }

  return topics;
}

function extractRssTitles(xml, source) {
  return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g)]
    .map((match) => decodeXml(match[1] ?? match[2] ?? ""))
    .filter((title) => title && !title.includes("Google News"))
    .slice(0, 10)
    .map((title) => ({
      source,
      theme: title.toLowerCase().replace(/[^\w\s-]/g, "").slice(0, 120),
      keywords: title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2)
        .slice(0, 8),
    }));
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
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
