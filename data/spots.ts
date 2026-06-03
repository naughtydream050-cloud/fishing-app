/**
 * data/spots.ts
 * 固定スポットマスタデータ
 *
 * - 実在確認済みの主要釣り場のみ収録
 * - AIで存在確認できないスポットは追加しない
 * - lat/lng は既存データに値なし → 0 で仮置き、warnings に記載
 * - safety系の値は控えめ設定（断定しない）
 * - dataSource: 'manual' = 手書き入力済みデータ
 */

import type { FishId } from '@/types/fish'

// ─── 型定義 ────────────────────────────────────────────────
export type FishingSpot = {
  id: string
  slug: string
  name: string
  prefecture: string       // 都道府県スラッグ（例: 'hiroshima'）
  area: string             // 市区町村スラッグ（例: 'hiroshima-city'）
  lat: number              // 0 = 未確認
  lng: number              // 0 = 未確認
  fishTypes: string[]      // 表示用魚種名（日本語）
  fishingMethods: string[] // 釣法（日本語）
  targetFishIds: FishId[]  // scoring.ts と接続する魚種ID（定義済みのもののみ）
  difficulty: '初心者OK' | '中級者向け' | '上級者向け'
  familyFriendly: 1 | 2 | 3 | 4 | 5   // 1=不向き 5=最適
  footSafety: 1 | 2 | 3 | 4 | 5       // 足場安全度
  windResistance: 1 | 2 | 3 | 4 | 5   // 風耐性（高=風に強い）
  nightFishing: boolean
  seasons: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)[]
  description: string
  accessNote?: string
  warnings?: string[]
  dataSource: 'manual' | 'ai_generated'
}

// ─── スポットデータ ─────────────────────────────────────────
export const FISHING_SPOTS: FishingSpot[] = [
  // ── 広島県 ──────────────────────────────────────────────
  {
    id: 'hiroshima-port',
    slug: 'hiroshima-port',
    name: '広島港',
    prefecture: 'hiroshima',
    area: 'hiroshima-city',
    lat: 34.3680,
    lng: 132.4530,
    fishTypes: ['アジ', 'メバル', 'チヌ', 'タコ'],
    fishingMethods: ['サビキ釣り', 'アジング', 'ウキ釣り'],
    targetFishIds: ['aji', 'mebaru'],
    difficulty: '初心者OK',
    familyFriendly: 4,
    footSafety: 4,
    windResistance: 3,
    nightFishing: true,
    seasons: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    description: '広島市南区にある大型港湾。常夜灯周りでアジ・メバルが狙える人気スポット。駐車場完備。ファミリーにも安心の整備された護岸です。',
    accessNote: '駐車場完備。24時間入場可能。',
    warnings: ['lat/lngは概算位置（広島港南埠頭付近）', '立入禁止区域の確認が必要', '釣果を保証しません'],
    dataSource: 'manual',
  },
  {
    id: 'hiroshima-miyajima',
    slug: 'hiroshima-miyajima',
    name: '宮島沖',
    prefecture: 'hiroshima',
    area: 'hatsukaichi',
    lat: 34.2960,
    lng: 132.3200,
    fishTypes: ['チヌ', 'アオリイカ', 'マダイ', 'アジ'],
    fishingMethods: ['フカセ釣り', 'エギング', 'ボート釣り'],
    targetFishIds: ['aji'],
    // ※ チヌ・アオリイカ・マダイは FishId 未定義のため targetFishIds に含めない
    difficulty: '中級者向け',
    familyFriendly: 2,
    footSafety: 2,
    windResistance: 2,
    nightFishing: false,
    seasons: [3, 4, 5, 9, 10, 11],
    description: '世界遺産・宮島の周辺海域。潮通しがよくチヌ・アオリイカが好調。フェリー乗り場付近の岸壁からも狙えます。春秋がとくに好シーズン。',
    warnings: ['lat/lngは概算位置（宮島島西側沖）', 'ボート使用時は免許・装備確認', '潮流強め・初心者注意', '釣果を保証しません'],
    dataSource: 'manual',
  },

  // ── 東京都 ──────────────────────────────────────────────
  {
    id: 'tokyo-sumida',
    slug: 'tokyo-sumida',
    name: '隅田川',
    prefecture: 'tokyo',
    area: 'sumida',
    lat: 35.6944,
    lng: 139.8008,
    fishTypes: ['シーバス', 'クロダイ', 'ハゼ'],
    fishingMethods: ['シーバスルアー', 'ブッコミ釣り'],
    targetFishIds: ['seabass'],
    difficulty: '中級者向け',
    familyFriendly: 2,
    footSafety: 3,
    windResistance: 4,
    nightFishing: true,
    seasons: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    description: '東京都心を流れる隅田川。橋脚周りでシーバスが回遊し、夜間は特に活性が高い。潮の干満に合わせた攻略が釣果のカギ。',
    warnings: ['lat/lngは概算位置（隅田川中流・両国橋付近）', '場所によっては立入禁止エリアあり、要確認', '路上駐車不可', '釣果を保証しません'],
    dataSource: 'manual',
  },
  {
    id: 'tokyo-odaiba',
    slug: 'tokyo-odaiba',
    name: 'お台場',
    prefecture: 'tokyo',
    area: 'koto',
    lat: 35.6267,
    lng: 139.7754,
    fishTypes: ['アジ', 'サバ', 'シーバス', 'ハゼ'],
    fishingMethods: ['サビキ釣り', 'ライトゲーム'],
    targetFishIds: ['aji', 'seabass'],
    difficulty: '初心者OK',
    familyFriendly: 4,
    footSafety: 4,
    windResistance: 3,
    nightFishing: true,
    seasons: [5, 6, 7, 8, 9, 10],
    description: '護岸整備された釣りやすいスポット。アジやサバが回遊し、ファミリーにも人気。柵付きの釣り場もあり子連れでも安心。',
    accessNote: '駐車場あり（有料）。',
    warnings: ['lat/lngは概算位置（お台場海浜公園護岸）', '混雑時は釣り座確保困難', '釣果を保証しません'],
    dataSource: 'manual',
  },

  // ── 山口県 ──────────────────────────────────────────────
  {
    id: 'yamaguchi-shimonoseki',
    slug: 'yamaguchi-shimonoseki',
    name: '下関港',
    prefecture: 'yamaguchi',
    area: 'shimonoseki',
    lat: 33.9519,
    lng: 130.9411,
    fishTypes: ['アジ', 'タチウオ', 'メバル', 'カサゴ'],
    fishingMethods: ['サビキ釣り', 'テンヤ（タチウオ）', 'アジング'],
    targetFishIds: ['aji', 'mebaru'],
    difficulty: '初心者OK',
    familyFriendly: 3,
    footSafety: 3,
    windResistance: 2,
    // 関門海峡は潮流強いため windResistance 低め
    nightFishing: true,
    seasons: [4, 5, 6, 7, 8, 9, 10, 11],
    description: '関門海峡に面した港。潮流が速く、フグ・アジ・タチウオが豊富。秋のタチウオシーズンはテンヤ釣りで大型が狙えます。',
    warnings: ['lat/lngは概算位置（下関港フェリーターミナル付近）', '潮流強め・ライフジャケット推奨', '釣果を保証しません'],
    dataSource: 'manual',
  },
  {
    id: 'yamaguchi-hagi',
    slug: 'yamaguchi-hagi',
    name: '萩漁港',
    prefecture: 'yamaguchi',
    area: 'hagi',
    lat: 34.4084,
    lng: 131.3990,
    fishTypes: ['メバル', 'マダイ', 'アオリイカ', 'カサゴ'],
    fishingMethods: ['メバリング', 'エギング', 'フカセ釣り'],
    targetFishIds: ['mebaru'],
    // マダイ・アオリイカは FishId 未定義
    difficulty: '中級者向け',
    familyFriendly: 2,
    footSafety: 3,
    windResistance: 3,
    nightFishing: true,
    seasons: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    description: '日本海に面した萩漁港。透明度が高くメバル・マダイ・アオリイカが狙える。夜のメバリングは数・型ともに期待大。',
    warnings: ['lat/lngは概算位置（萩漁港北側護岸付近）', '漁港作業の妨害にならないよう配慮', '釣果を保証しません'],
    dataSource: 'manual',
  },

  // ── 岡山県 ──────────────────────────────────────────────
  {
    id: 'okayama-kojima',
    slug: 'okayama-kojima',
    name: '児島湖',
    prefecture: 'okayama',
    area: 'okayama-city',
    lat: 34.5750,
    lng: 133.9300,
    fishTypes: ['ブラックバス', 'ナマズ', 'ヘラブナ'],
    fishingMethods: ['バス釣り（トップウォーター）', 'バス釣り（ワーム）', 'ヘラブナ釣り'],
    targetFishIds: ['black_bass'],
    difficulty: '中級者向け',
    familyFriendly: 2,
    footSafety: 2,
    windResistance: 3,
    nightFishing: false,
    seasons: [4, 5, 6, 7, 8, 9, 10],
    description: '岡山市南部にある汽水湖。バス釣りの名所で、スポーニング期は大型狙いにチャンス。ボート・岸釣りともに可能。',
    warnings: ['lat/lngは概算位置（児島湖北岸）', '湖岸の足場が不安定な箇所あり', 'ボート使用時は要確認', '釣果を保証しません'],
    dataSource: 'manual',
  },
  {
    id: 'okayama-tamano',
    slug: 'okayama-tamano',
    name: '玉野港',
    prefecture: 'okayama',
    area: 'tamano',
    lat: 34.4920,
    lng: 133.9440,
    fishTypes: ['チヌ', 'シーバス', 'アジ', 'メバル'],
    fishingMethods: ['サビキ釣り', 'ウキフカセ', 'ルアー'],
    targetFishIds: ['seabass', 'aji', 'mebaru'],
    // チヌは FishId 未定義
    difficulty: '初心者OK',
    familyFriendly: 3,
    footSafety: 3,
    windResistance: 3,
    nightFishing: true,
    seasons: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    description: '瀬戸内海に面した玉野市の漁港。干満差を利用したチヌ・シーバス釣りが人気。サビキでアジも釣れる万能ポイント。',
    warnings: ['lat/lngは概算位置（玉野港南側岸壁付近）', '漁港内は作業船に注意', '釣果を保証しません'],
    dataSource: 'manual',
  },
]

// ─── ユーティリティ関数 ────────────────────────────────────

/** 全スポット取得 */
export function getAllFishingSpots(): FishingSpot[] {
  return FISHING_SPOTS
}

/** slug でスポット取得 */
export function getFishingSpotBySlug(slug: string): FishingSpot | undefined {
  return FISHING_SPOTS.find((s) => s.slug === slug)
}

/** 都道府県でスポット取得 */
export function getFishingSpotsByPrefecture(prefecture: string): FishingSpot[] {
  return FISHING_SPOTS.filter((s) => s.prefecture === prefecture)
}

/** 都道府県 + エリアでスポット取得 */
export function getFishingSpotsByArea(prefecture: string, area: string): FishingSpot[] {
  return FISHING_SPOTS.filter((s) => s.prefecture === prefecture && s.area === area)
}
