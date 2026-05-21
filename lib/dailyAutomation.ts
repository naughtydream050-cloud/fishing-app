import { auditAllContent } from '@/lib/contentQualityRules'
import {
  queueJobsFromAudit,
  processNextJob,
  getQueueSummary,
  type ContentJob,
} from '@/lib/contentAutomation'
import { MOCK_ARTICLES } from '@/lib/mockArticles'
import { MOCK_SPOTS } from '@/lib/mockSpots'

export type AutomationTaskName =
  | 'content_audit'
  | 'gear_refresh'
  | 'job_queue_process'
  | 'stale_data_check'

export type AutomationTaskResult = {
  task: AutomationTaskName
  success: boolean
  durationMs: number
  details: Record<string, unknown>
  error?: string
}

export type DailyAutomationResult = {
  runId: string
  startedAt: string
  completedAt: string
  totalDurationMs: number
  tasks: AutomationTaskResult[]
  newJobsQueued: number
  errors: number
}

export type WeeklyAutomationResult = DailyAutomationResult & {
  articlesReviewed: number
  gearSetsUpdated: number
}

// Phase 1: in-memory queue — Phase 2でSupabaseに移行予定
let _jobQueue: ContentJob[] = []

export async function runDailyAutomation(): Promise<DailyAutomationResult> {
  const today = new Date().toISOString().slice(0, 10)
  const runId = `daily-${today}`
  const startedAt = new Date().toISOString()
  const tasks: AutomationTaskResult[] = []
  let newJobsQueued = 0
  let errors = 0

  // Task 1: content_audit
  {
    const taskStart = Date.now()
    try {
      const allSpots = Object.values(MOCK_SPOTS).flat()
      const auditResult = auditAllContent({ articles: MOCK_ARTICLES, spots: allSpots })
      const newJobs = queueJobsFromAudit(auditResult.results)
      const existingIds = new Set(_jobQueue.map(j => `${j.contentId}:${j.type}`))
      const uniqueNew = newJobs.filter(j => !existingIds.has(`${j.contentId}:${j.type}`))
      _jobQueue = [..._jobQueue, ...uniqueNew]
      newJobsQueued += uniqueNew.length
      tasks.push({
        task: 'content_audit',
        success: true,
        durationMs: Date.now() - taskStart,
        details: {
          totalChecked: auditResult.totalChecked,
          passed: auditResult.passed,
          failed: auditResult.failed,
          newJobsQueued: uniqueNew.length,
          summary: auditResult.summary,
        },
      })
    } catch (err) {
      errors++
      console.error('[dailyAutomation] content_audit failed:', err)
      tasks.push({
        task: 'content_audit',
        success: false,
        durationMs: Date.now() - taskStart,
        details: {},
        error: String(err),
      })
    }
  }

  // Task 2: stale_data_check
  {
    const taskStart = Date.now()
    try {
      const result = await checkStaleData()
      tasks.push({
        task: 'stale_data_check',
        success: true,
        durationMs: Date.now() - taskStart,
        details: result as unknown as Record<string, unknown>,
      })
    } catch (err) {
      errors++
      console.error('[dailyAutomation] stale_data_check failed:', err)
      tasks.push({
        task: 'stale_data_check',
        success: false,
        durationMs: Date.now() - taskStart,
        details: {},
        error: String(err),
      })
    }
  }

  // Task 3: gear_refresh (ISR revalidation に委譲)
  {
    const taskStart = Date.now()
    tasks.push({
      task: 'gear_refresh',
      success: true,
      durationMs: Date.now() - taskStart,
      details: {
        status: 'skipped',
        reason: 'gear refresh is handled by ISR revalidation (revalidate=3600)',
      },
    })
  }

  // Task 4: job_queue_process
  {
    const taskStart = Date.now()
    try {
      const result = await processPendingJobs(3)
      tasks.push({
        task: 'job_queue_process',
        success: true,
        durationMs: Date.now() - taskStart,
        details: {
          processed: result.processed,
          failed: result.failed,
          queueSummary: getQueueSummary(_jobQueue),
        },
      })
    } catch (err) {
      errors++
      console.error('[dailyAutomation] job_queue_process failed:', err)
      tasks.push({
        task: 'job_queue_process',
        success: false,
        durationMs: Date.now() - taskStart,
        details: {},
        error: String(err),
      })
    }
  }

  const completedAt = new Date().toISOString()
  const totalDurationMs =
    new Date(completedAt).getTime() - new Date(startedAt).getTime()

  return { runId, startedAt, completedAt, totalDurationMs, tasks, newJobsQueued, errors }
}

export async function runWeeklyAutomation(): Promise<WeeklyAutomationResult> {
  const daily = await runDailyAutomation()
  return {
    ...daily,
    runId: daily.runId.replace('daily-', 'weekly-'),
    articlesReviewed: 0,
    gearSetsUpdated: 0,
  }
}

export async function checkStaleData(): Promise<{
  staleForecasts: string[]
  staleGear: string[]
  warnings: string[]
}> {
  const staleForecasts: string[] = []
  const staleGear: string[] = []
  const warnings: string[] = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    warnings.push('Supabase未接続のため鮮度チェックをスキップしました（デモモード）')
    return { staleForecasts, staleGear, warnings }
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    const { data: forecastData } = await supabaseAdmin
      .from('regional_forecasts')
      .select('region_id, generated_at')
      .lt('generated_at', twoDaysAgo)
      .limit(20)

    if (forecastData?.length) {
      staleForecasts.push(
        ...(forecastData as { region_id: string; generated_at: string }[]).map(r => r.region_id)
      )
      warnings.push(`${forecastData.length}件の予報データが48時間以上更新されていません。`)
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    const { data: gearData } = await supabaseAdmin
      .from('gear_prices')
      .select('gear_name, fetched_at')
      .lt('fetched_at', twoHoursAgo)
      .limit(20)

    if (gearData?.length) {
      staleGear.push(
        ...[
          ...new Set(
            (gearData as { gear_name: string; fetched_at: string }[]).map(r => r.gear_name)
          ),
        ]
      )
    }
  } catch (err) {
    warnings.push(`Supabase鮮度チェックでエラーが発生しました: ${String(err)}`)
  }

  return { staleForecasts, staleGear, warnings }
}

export async function processPendingJobs(maxJobs = 3): Promise<{
  processed: number
  failed: number
}> {
  let processed = 0
  let failed = 0

  for (let i = 0; i < maxJobs; i++) {
    const { job, remainingQueue } = await processNextJob(_jobQueue)
    _jobQueue = remainingQueue
    if (!job) break
    if (job.status === 'generated') processed++
    else if (job.status === 'failed') failed++
  }

  return { processed, failed }
}
