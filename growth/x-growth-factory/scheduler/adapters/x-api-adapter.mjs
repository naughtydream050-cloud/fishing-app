import { createHmac, randomBytes } from "node:crypto";

const requiredEnv = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"];

export async function post({ post }) {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing X API env vars: ${missing.join(", ")}`);
  }

  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text: post.text });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: buildOAuthHeader({
        method: "POST",
        url,
        consumerKey: process.env.X_API_KEY,
        consumerSecret: process.env.X_API_SECRET,
        token: process.env.X_ACCESS_TOKEN,
        tokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
      }),
      "content-type": "application/json",
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`X API failed with ${response.status}: ${JSON.stringify(payload).slice(0, 180)}`);
  }

  return {
    status: "posted",
    postId: typeof payload?.data?.id === "string" ? payload.data.id : null,
    adapter: "x_api",
    message: "Posted through X API.",
  };
}

function buildOAuthHeader({ method, url, consumerKey, consumerSecret, token, tokenSecret }) {
  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: "1.0",
  };
  const signatureBase = [
    method.toUpperCase(),
    encode(url),
    encode(new URLSearchParams(sortParams(oauth)).toString()),
  ].join("&");
  const signingKey = `${encode(consumerSecret)}&${encode(tokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

  return `OAuth ${Object.entries({ ...oauth, oauth_signature: signature })
    .map(([key, value]) => `${encode(key)}="${encode(value)}"`)
    .join(", ")}`;
}

function sortParams(params) {
  return Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
}

function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}
