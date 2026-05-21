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
    title: '山口・下関でメバルの数釣り！常夜灯ゲームが好調',
    sourceName: '釣果情報（山口）',
    sourceUrl: '#',
    area: '山口・下関',
    fishName: ['メバル'],
    publishedAt: '2026-05-13',
    summary: '常夜灯周りのメバリングが絶好調。1〜3gのジグヘッドにワームで連発。20cm前後の良型も交じる。',
    imageUrl: 'https://placehold.co/400x200/e8f8f0/2c7a5f?text=山口+釣果',
  },
  {
    id: 'report-005',
    title: '岡山・笠岡でチヌのフカセ釣りが絶好調',
    sourceName: '釣果情報（岡山）',
    sourceUrl: '#',
    area: '岡山・笠岡',
    fishName: ['チヌ'],
    publishedAt: '2026-05-12',
    summary: 'フカセ釣りでチヌが安定して釣れています。朝マヅメに集中的に当たりが出て、45cm超えの大型も。',
    imageUrl: 'https://placehold.co/400x200/f8f8e8/6a7a2c?text=岡山+釣果',
  },
  {
    id: 'report-006',
    title: '広島・江田島でアジング釣行レポート',
    sourceName: '釣果情報（中国地方）',
    sourceUrl: '#',
    area: '広島・江田島',
    fishName: ['アジ'],
    publishedAt: '2026-05-11',
    summary: '夕マヅメから夜にかけてアジが爆釣。1.5gジグヘッド＋ストレートワームで20〜25cmが入れ食い状態。',
    imageUrl: 'https://placehold.co/400x200/e8f0f8/2c4f7a?text=江田島+釣果',
  },
]
