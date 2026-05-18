export async function post({ post }) {
  const webhookUrl = process.env.X_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("X_WEBHOOK_URL is required for webhook posting.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      source: "spec-ai-x-growth-factory",
      post,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Webhook failed with ${response.status}: ${detail.slice(0, 160)}`);
  }

  const payload = await response.json().catch(() => ({}));

  return {
    status: "posted",
    postId: typeof payload.id === "string" ? payload.id : null,
    adapter: "webhook",
    message: "Webhook accepted post.",
  };
}
