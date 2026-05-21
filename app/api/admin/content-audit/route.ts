import { NextRequest, NextResponse } from 'next/server'
import { auditAllContent } from '@/lib/contentQualityRules'
import { queueJobsFromAudit } from '@/lib/contentAutomation'
import { MOCK_ARTICLES } from '@/lib/mockArticles'
import { MOCK_SPOTS } from '@/lib/mockSpots'

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allSpots = Object.values(MOCK_SPOTS).flat()
  const auditResult = auditAllContent({ articles: MOCK_ARTICLES, spots: allSpots })
  const jobs = queueJobsFromAudit(auditResult.results)

  const priorityA = jobs.filter(j => j.priority === 1)
  const priorityB = jobs.filter(j => j.priority === 2)
  const priorityC = jobs.filter(j => j.priority === 3)

  return NextResponse.json({
    auditedAt: new Date().toISOString(),
    summary: auditResult.summary,
    totalChecked: auditResult.totalChecked,
    passed: auditResult.passed,
    failed: auditResult.failed,
    jobsQueued: jobs.length,
    prioritySummary: {
      A: priorityA.length,
      B: priorityB.length,
      C: priorityC.length,
    },
    nextActions: {
      generateArticles: priorityA.filter(j => j.contentType === 'article').map(j => j.contentId),
      strengthenSpots:  priorityA.filter(j => j.contentType === 'spot').map(j => j.contentId),
    },
    results: auditResult.results,
    jobs,
  })
}
