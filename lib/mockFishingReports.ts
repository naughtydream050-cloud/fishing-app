/**
 * mockFishingReports.ts
 * 将来的にX API / ブログ / 釣具屋情報から取得できる構造
 */

export type FishingReport = {
  id: string
  title: string
  sourceName: string
  sourceUrl: string
  area: string
  fishName: string[]
  publishedAt: string
  summary: string
  imageUrl?: string
}

export const MOCK_FISHING_REPORTS: FishingReport[] = [
  {
    id: 'report-001',
    title: '大阪湾でアジ・サバの爆釣！サビキ仕掛けが大活躍',
    sourceName: '釣果情報（大阪湾）',
    sourceUrl: '#',
    area: '大阪湾',
    fishName: ['アジ', 'サバ'],
    publishedAt: '2026-05-16',
    summary: '夕マヅメ〜夜にかけてアジ・サバが好調。サビキ仕掛けで連発。水温16℃と安定しており、今週末も期待できます。',
    imageUrl: 'https://placehold.co/400x200/e8f4f8/2c5f7a?text=大阪湾+釣果',
  },
  {
    id: 'report-002',
    title: '広島・呉エリアでチヌ（クロダイ）が好調',
    sourceName: '釣果情報（中国地方）',
    sourceUrl: '#',
    area: '広島・呉',
    fishName: ['チヌ', 'クロダイ'],
    publishedAt: '2026-05-15',
    summary: '落とし込み釣りでチヌが連発。40cm前後の良型が多数。港内の障害物周りが特に好ポイント。',
    imageUrl: 'https://placehold.co/400x200/f0f8e8/2c7a3f?text=広島+釣果',
  },
  {
    id: 'report-003',
    title: '東京湾でシーバス・クロダイが活発',
    sourceName: '釣果情報（東京湾）',
    sourceUrl: '#',
    area: '東京湾',
    fishName: ['シーバス', 'クロダイ'],
    publishedAt: '2026-05-14',
    summary: 'ナイトゲームでシーバスが好調。ミノー系ルアーへの反応が良好。橋脚周りと河口エリアがオススメ。',
    imageUrl: 'https://placehold.co/400x200/f8f0e8/7a4f2c?text=東京湾+釣果',
  },
]
