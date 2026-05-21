import { publishThreadsTextPost } from "./threads-api.mjs";

export async function postToThreads({ post, dryRun, cronSecret }) {
  if (dryRun || process.env.THREADS_AUTO_POST_ENABLED !== "true") {
    return {
      status: "setup_required",
      posted: false,
      reason: "THREADS_AUTO_POST_ENABLED is not true.",
    };
  }

  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return {
      status: "setup_required",
      posted: false,
      reason: "Valid CRON_SECRET is required for real posting.",
    };
  }

  if (!process.env.THREADS_ACCESS_TOKEN || !process.env.THREADS_USER_ID) {
    return {
      status: "setup_required",
      posted: false,
      reason: "THREADS_ACCESS_TOKEN and THREADS_USER_ID are required.",
    };
  }

  const result = await publishThreadsTextPost({
    text: post.text,
    accessToken: process.env.THREADS_ACCESS_TOKEN,
    userId: process.env.THREADS_USER_ID,
  });

  return {
    ...result,
    posted: true,
  };
}
