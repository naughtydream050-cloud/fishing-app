# Agent: Scheduler Checker

Task:
Approve scheduling only for 10/10 posts.

Rules:
- exactly 1 post/day
- max 2 link posts/week
- randomized time window
- no duplicate structure two days in a row
- no engagement automation
- do not schedule rejected posts

Preferred free paths:
- X native scheduled posts if available
- free-tier social scheduler if configured
- local queue export if no free posting API exists

Output:
{
  "postId": "id",
  "scheduledFor": "YYYY-MM-DDTHH:mm:ss+09:00",
  "method": "configured_scheduler_or_queue",
  "status": "scheduled"
}
