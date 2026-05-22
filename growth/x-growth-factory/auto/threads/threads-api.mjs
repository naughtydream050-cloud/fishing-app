const graphBaseUrl = "https://graph.threads.net/v1.0";

export async function publishThreadsPost({ post, accessToken, userId }) {
  if (post.imageUrl) {
    return publishThreadsImagePost({
      text: post.text,
      imageUrl: post.imageUrl,
      altText: post.imageAltText,
      accessToken,
      userId,
    });
  }

  return publishThreadsTextPost({ text: post.text, accessToken, userId });
}

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

export async function publishThreadsImagePost({ text, imageUrl, altText, accessToken, userId }) {
  const body = new URLSearchParams({
    media_type: "IMAGE",
    image_url: imageUrl,
    text,
    access_token: accessToken,
  });

  if (altText) body.set("alt_text", altText);

  const create = await fetch(`${graphBaseUrl}/${encodeURIComponent(userId)}/threads`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const createPayload = await create.json().catch(() => ({}));
  if (!create.ok || !createPayload.id) {
    throw new Error(`Threads image create failed with ${create.status}`);
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
    throw new Error(`Threads image publish failed with ${publish.status}`);
  }

  return {
    postId: publishPayload.id,
    status: "posted",
  };
}
