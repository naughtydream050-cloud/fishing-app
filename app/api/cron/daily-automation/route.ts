import { NextRequest, NextResponse } from 'next/server'
import { runDailyAutomation } from '@/lib/dailyAutomation'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDailyAutomation()
    return NextResponse.json({
      ok: true,
      runId: result.runId,
      durationMs: result.totalDurationMs,
      newJobsQueued: result.newJobsQueued,
      errors: result.errors,
      tasks: result.tasks.map(t => ({
        task: t.task,
        success: t.success,
        durationMs: t.durationMs,
        details: t.details,
        error: t.error,
      })),
    })
  } catch (err) {
    console.error('[cron/daily-automation] Fatal error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
