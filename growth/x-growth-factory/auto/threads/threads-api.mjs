const graphBaseUrl = "https://graph.threads.net/v1.0";

export async function publishThreadsTextPost({ text, accessToken, userId }) {
  const create = await fetch(`${graphBaseUrl}/${encodeURIComponent(userId)}/threads`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      media_type: "TEXT",
      text,
      access_token: accessToken,
    }),
  });

  const createPayload = await create.json().catch(() => ({}));
  if (!create.ok || !createPayload.id) {
    throw new Error(`Threads create failed with ${create.status}`);
  }

  const publish = await fetch(`${graphBaseUrl}/${encodeURIComponent(userId)}/threads_publish`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      creation_id: createPayload.id,
      access_token: accessToken,
    }),
  });

  const publishPayload = await publish.json().catch(() => ({}));
  if (!publish.ok || !publishPayload.id) {
    throw new Error(`Threads publish failed with ${publish.status}`);
  }

  return {
    postId: publishPayload.id,
    status: "posted",
  };
}
