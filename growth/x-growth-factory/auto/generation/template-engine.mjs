export function generatePost({ topic, templates, config, postingLog }) {
  const linkCount = weeklyLinkCount(postingLog);
  const latestPattern = latestPostedPattern(postingLog);
  const candidates = templates.templates.filter(
    (template) =>
      template.id !== latestPattern &&
      (!template.linkAllowed || linkCount < config.weeklyLinkPostLimit)
  );
  const selected = candidates[0] ?? templates.templates[0];

  return {
    id: `threads-${new Date().toISOString().slice(0, 10)}-${selected.id}`,
    channel: "threads",
    score: 10,
    pattern: selected.id,
    topic: topic?.theme ?? "manual",
    text: selected.text,
    linkIncluded: /https?:\/\//i.test(selected.text),
    targetKpi: selected.linkAllowed ? "clicks" : "freeUses",
    generatedBy: "deterministic-template-engine",
  };
}

function weeklyLinkCount(postingLog) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  return (postingLog.items ?? []).filter((item) => {
    const postedAt = new Date(item.postedAt);
    return (
      item.channel === "threads" &&
      ["posted", "scheduled", "exported"].includes(item.status) &&
      item.linkIncluded &&
      postedAt >= weekStart
    );
  }).length;
}

function latestPostedPattern(postingLog) {
  return (postingLog.items ?? [])
    .filter((item) => item.channel === "threads" && ["posted", "scheduled"].includes(item.status))
    .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))[0]?.pattern;
}
