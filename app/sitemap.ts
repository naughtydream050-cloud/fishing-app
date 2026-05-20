import type { MetadataRoute } from 'next'
import { REGIONS } from '@/types/region'
import { MOCK_ARTICLES } from '@/lib/mockArticles'
import { MOCK_SPOTS } from '@/lib/mockSpots'
import { MOCK_FISHING_REPORTS } from '@/lib/mockFishingReports'

const BASE = 'https://fishing-app-omega.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const regionPages: MetadataRoute.Sitemap = REGIONS.flatMap((r) => {
    const spots = MOCK_SPOTS[r.id] ?? []
    return [
      { url: `${BASE}/areas/${r.slug}`, changeFrequency: 'weekly', priority: 0.8 },
      ...spots.map((s) => ({
        url: `${BASE}/areas/${r.slug}/spots/${s.id}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ]
  })

  const articlePages: MetadataRoute.Sitemap = MOCK_ARTICLES.map((a) => ({
    url: `${BASE}/articles/${a.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const reportPages: MetadataRoute.Sitemap = MOCK_FISHING_REPORTS.map((r) => ({
    url: `${BASE}/reports/${r.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }))

  return [
    { url: BASE,                         changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/forecast`,           changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/areas`,              changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/articles`,           changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${BASE}/reports`,            changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/deals`,              changeFrequency: 'daily',   priority: 0.65 },
    { url: `${BASE}/subscribe`,          changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE}/signup`,             changeFrequency: 'monthly', priority: 0.6 },
    ...regionPages,
    ...articlePages,
    ...reportPages,
  ]
}
