import type { Metadata } from 'next'
import { getAllReports, getLatestReports, getReportsByRegion } from '@/lib/fishingReports'

type Props = {
  searchParams: Promise<{ region?: string }>
}

export const metadata: Metadata = {
  title: '釣果レポート | 釣り予報AI',
  description:
    '広島・大阪・東京・岡山・山口の最新釣果レポートをお届け。週次・地域別・釣り場別の詳細な釣果傾向と仕掛け情報。',
  openGraph: {
    title: '釣果レポート | 釣り予報AI',
    description: '全国各地の最新釣果レポート。週次・地域別の釣果傾向と有効な仕掛けを解説。',
    url: 'https://fishing-app-omega.vercel.app/reports',
  },
}

const REGION_FILTERS = [
  { label: '全て', slug: '' },
  { label: '広島', slug: 'hiroshima' },
  { label: '大阪', slug: 'osaka' },
  { label: '東京', slug: 'tokyo_23' },
  { label: '岡山', slug: 'okayama' },
  { label: '山口', slug: 'yamaguchi' },
]

const DATA_SOURCE_LABELS: Record<string, string> = {
  manual: '編集部データ',
  mock: 'デモデータ',
  api: 'リアルタイム',
  generated: 'AI生成',
}

const DATA_SOURCE_COLORS: Record<string, string> = {
  manual: '#e8f5e9',
  mock: '#fff8e1',
  api: '#e3f2fd',
  generated: '#f3e5f5',
}

const DATA_SOURCE_TEXT_COLORS: Record<string, string> = {
  manual: '#2e7d32',
  mock: '#f57f17',
  api: '#1565c0',
  generated: '#6a1b9a',
}

function estimateReadMinutes(sections: { body: string }[]): number {
  const totalChars = sections.reduce((sum, s) => sum + s.body.length, 0)
  return Math.max(1, Math.ceil(totalChars / 400))
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  return `${s.getMonth() + 1}/${s.getDate()}〜${e.getMonth() + 1}/${e.getDate()}`
}

export default async function ReportsPage({ searchParams }: Props) {
  const { region: regionFilter = '' } = await searchParams

  co