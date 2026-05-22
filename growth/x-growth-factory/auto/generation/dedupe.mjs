export function addIfNotDuplicate(queue, post) {
  const key = normalize(post.text);
  const exists = (queue.items ?? []).some((item) => normalize(item.text) === key);
  if (exists) return { queue, added: false };

  return {
    queue: {
      ...queue,
      items: [...(queue.items ?? []), post],
    },
    added: true,
  };
}

function normalize(text) {
  return String(text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}
