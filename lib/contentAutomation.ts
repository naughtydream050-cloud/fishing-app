/**
 * SAFETY INVARIANT: AI-generated content MUST pass through 'reviewed' before 'published'.
 * Auto-publishing is forbidden. runAiGenerationStub() only sets status='generated'.
 * A human must call transitionJobStatus(job, 'reviewed') then transitionJobStatus(job, 'published').
 * Any code path that sets status='published' without a prior 'reviewed' state will throw.
 */

import type { QualityResult } from '@/lib/contentQualityRules'

export type JobType =
  | 'generate_article_body'
  | 'generate_related_spots'
  | 'add_gear_cta'
  | 'add_data_source_badge'
  | 'expand_article'

export type JobStatus =
  | 'queued'
  | 'generating'
  | 'generated'
  | 'reviewed'
  | 'published'
  | 'rejected'
  | 'failed'

export type ContentJob = {
  id: string
  type: JobType
  status: JobStatus
  contentId: string
  contentType: 'article' | 'spot'
  priority: number
  qualityScore: number
  qualityIssues: string[]
  createdAt: string
  updatedAt: string
  generatedContent?: string
  reviewedBy?: string
  publishedAt?: string
  errorMessage?: string
  metadata?: Record<string, unknown>
}

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  queued:     ['generating'],
  generating: ['generated', 'failed'],
  generated:  ['reviewed', 'failed'],
  reviewed:   ['published', 'rejected'],
  published:  [],
  rejected:   ['queued'],
  failed:     [],
}

function detectJobType(result: QualityResult): JobType {
  const issueFields = result.issues.map(i => i.field)
  if (issueFields.includes('body')) return 'generate_article_body'
  if (issueFields.includes('relatedSpotIds')) return 'generate_related_spots'
  if (issueFields.includes('dataSource') || issueFields.includes('contentSource')) return 'add_data_source_badge'
  if (issueFields.includes('gearSetId')) return 'add_gear_cta'
  return 'expand_article'
}

export function createJobFromQualityResult(result: QualityResult, jobType?: JobType): ContentJob {
  const type = jobType ?? detectJobType(result)

  let priority: number
  if (result.score < 40) priority = 1
  else if (result.score < 70) priority = 2
  else priority = 3

  const now = new Date().toISOString()
  return {
    id: `job-${result.id}-${Date.now()}`,
    type,
    status: 'queued',
    contentId: result.id,
    contentType: result.contentType,
    priority,
    qualityScore: result.score,
    qualityIssues: result.issues.map(i => i.field),
    createdAt: now,
    updatedAt: now,
  }
}

export function queueJobsFromAudit(auditResults: QualityResult[]): ContentJob[] {
  const seen = new Set<string>()
  const jobs: ContentJob[] = []

  for (const result of auditResults) {
    if (result.passed) continue
    const key = `${result.id}:${detectJobType(result)}`
    if (seen.has(key)) continue
    seen.add(key)
    jobs.push(createJobFromQualityResult(result))
  }

  return jobs
}

export function transitionJobStatus(
  job: ContentJob,
  newStatus: JobStatus,
  metadata?: { reviewedBy?: string; errorMessage?: string; publishedAt?: string }
): ContentJob {
  const allowed = VALID_TRANSITIONS[job.status]
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${job.status} → ${newStatus}`)
  }

  // SAFETY: published は reviewed を経由しないと到達不可能
  if (newStatus === 'published') {
    if (job.status !== 'reviewed') {
      throw new Error('SAFETY: published state is only reachable from reviewed state')
    }
    if (!metadata?.reviewedBy && !job.reviewedBy) {
      throw new Error('SAFETY: reviewedBy must be set before publishing')
    }
  }

  return {
    ...job,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    ...(metadata?.reviewedBy ? { reviewedBy: metadata.reviewedBy } : {}),
    ...(metadata?.errorMessage ? { errorMessage: metadata.errorMessage } : {}),
    ...(metadata?.publishedAt ? { publishedAt: metadata.publishedAt } : {}),
  }
}

export async function runAiGenerationStub(job: ContentJob): Promise<ContentJob> {
  console.log('[contentAutomation] STUB: would generate', job.type, 'for', job.contentId)
  const inProgress = transitionJobStatus(job, 'generating')
  await new Promise(resolve => setTimeout(resolve, 10))
  const stubContent = [
    `[AI生成スタブ] ${job.type} for ${job.contentId}`,
    `生成日時: ${new Date().toISOString()}`,
    `本番では実際のAI生成コンテンツが入ります。`,
    `type: ${job.type} / priority: ${job.priority} / score: ${job.qualityScore}`,
  ].join('\n')
  return {
    ...inProgress,
    status: 'generated',
    generatedContent: stubContent,
    updatedAt: new Date().toISOString(),
  }
}

export async function processNextJob(queue: ContentJob[]): Promise<{
  job: ContentJob | null
  remainingQueue: ContentJob[]
}> {
  const queued = queue
    .filter(j => j.status === 'queued')
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

  if (queued.length === 0) return { job: null, remainingQueue: queue }

  const next = queued[0]
  const processed = await runAiGenerationStub(next)
  const remainingQueue = queue.map(j => (j.id === processed.id ? processed : j))
  return { job: processed, remainingQueue }
}

export function getQueueSummary(queue: ContentJob[]): {
  total: number
  byStatus: Partial<Record<JobStatus, number>>
  byPriority: Record<number, number>
  oldestQueuedAt: string | null
} {
  const byStatus: Partial<Record<JobStatus, number>> = {}
  const byPriority: Record<number, number> = {}

  for (const job of queue) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1
    byPriority[job.priority] = (byPriority[job.priority] ?? 0) + 1
  }

  const queuedJobs = queue.filter(j => j.status === 'queued')
  const oldestQueuedAt =
    queuedJobs.length > 0
      ? queuedJobs.reduce(
          (oldest, j) => (j.createdAt < oldest ? j.createdAt : oldest),
          queuedJobs[0].createdAt
        )
      : null

  return { total: queue.length, byStatus, byPriority, oldestQueuedAt }
}
