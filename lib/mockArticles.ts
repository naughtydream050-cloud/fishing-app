/**
 * mockArticles.ts
 * 将来的にCMS / Supabase / 外部ブログから取得できる構造
 */

export type Article = {
  id: string
  title: string
  slug: string
  category: string
  publishedAt: string
  summary: string
  imageUrl?: string
}

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'article-001',
    title: '【2026年5月】今週釣れている魚まとめ｜全国版',
    slug: 'weekly-fish-may-2026',
    category: '釣果まとめ',
    publishedAt: '2026-05-17',
    summary: 'アジ・シーバス・チヌが全国的に好調。水温上昇でルアーへの反応が活発になっています。',
    imageUrl: 'https://placehold.co/400x200/e8f4f8/1a4f8a?text=今週の釣果まとめ',
  },
  {
    id: 'article-002',
    title: '初心者向け！ファミリーで楽しめる釣り場10選',
    slug: 'family-fishing-spots',
    category: '釣り場ガイド',
    publishedAt: '2026-05-16',
    summary: '柵付きで安心の釣り公園から、サビキ釣りで数釣りできるスポットまで、ファミリーに最適な場所を紹介。',
    imageUrl: 'https://placehold.co/400x200/f0f8e8/2c7a3f?text=ファミリー釣り場',
  },
  {
    id: 'article-003',
    title: '雨の日でも狙える！おすすめ釣り場と仕掛け',
    slug: 'rainy-day-fishing',
    category: 'テクニック',
    publishedAt: '2026-05-15',
    summary: '雨天時はチヌやシーバスが活性アップ。屋根付きの桟橋や港内の壁際を狙う攻略法を解説。',
    imageUrl: 'https://placehold.co/400x200/f8f0e8/7a4f2c?text=雨の日の釣り',
  },
  {
    id: 'article-004',
    title: 'アジング入門｜道具選びから釣り方まで完全ガイド',
    slug: 'ajing-beginners-guide',
    category: '入門ガイド',
    publishedAt: '2026-05-14',
    summary: '軽量ジグヘッドとワームで手軽に楽しめるアジング。初心者でも釣れるタックル選びと基本テクニックを紹介。',
    imageUrl: 'https://placehold.co/400x200/f8f8e8/4a4a7a?text=アジング入門',
  },
]
