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
  {
    id: 'report-004',
    title: '山口・下関エリアでタチウオが絶好調',
    sourceName: '釣果情報（山口県）',
    sourceUrl: '#',
    area: '山口・下関',
    fishName: ['タチウオ'],
    publishedAt: '2026-05-13',
    summary: '夕マズメからタチウオが入れ食い。テンヤ仕掛けに反応抜群。指4本以上の良型も多数。',
    imageUrl: 'https://placehold.co/400x200/e8e8f8/4a4a8a?text=山口+釣果',
  },
  {
    id: 'report-005',
    title: '岡山・児島湾でメバル・カサゴが好調',
    sourceName: '釣果情報（岡山県）',
    sourceUrl: '#',
    area: '岡山・児島湾',
    fishName: ['メバル', 'カサゴ'],
    publishedAt: '2026-05-12',
    summary: 'アジング・メバリングで数釣り。堤防際の常夜灯周りが特に好ポイント。初心者にも実績あり。',
    imageUrl: 'https://placehold.co/400x200/e8f8e8/3a7a3a?text=岡山+釣果',
  },
  {
    id: 'report-006',
    title: '広島・宮島沖でマダイ・イサキが回遊',
    sourceName: '釣果情報（広島県）',
    sourceUrl: '#',
    area: '広島・宮島沖',
    fishName: ['マダイ', 'イサキ'],
    publishedAt: '2026-05-11',
    summary: '船釣りでマダイ・イサキが好調。コマセ釣りで40cm超のマダイが複数本。中級者向けだが釣果安定。',
    imageUrl: 'https://placehold.co/400x200/f8e8f0/8a3a6a?text=広島+釣果',
  },
]
