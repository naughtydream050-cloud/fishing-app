/**
 * lib/spotScoreRepository.ts
 *
 * spot_daily_scores テーブルへの読み取りrepository。
 * forecastRepository.ts と同じ Supabase → fallback 構造。
 *
 * 読み取りには ANON KEY を使用（RLSで public read 許可済み）。
 * secret / service_role key はログに出力しない。
 */

import { createClient } from '@supabase/supabase-js'
import { getAllFishingSpots } from '@/data/spots'
import { getTideSnapshot } from '@/lib/tide'

// ─── 公開型 ─────────────────────────────────────────────────

export type SpotDailyScore = {
  id?: string
  spot_id: string
  prefecture: string
  area: string
  valid_date: string
  score: number
  rank?: number | null
  target_fish: string
  best_time_bands?: string[] | null
  weather_score?: number | null
  wind_score?: number | null
  tide_score?: number | null
  season_score?: number | null
  safety_score?: number | null
  reasons?: string[] | null
  cautions?: string[] | null
  is_mock?: boolean
  data_source?: string
  generated_at?: string
}

export type SpotScoreDataStatus = {
  source: 'supabase' | 'fallback'
  reason: 'ok' | 'missing-env' | 'no-data' | 'fetch-error'
  message: string
}

export type SpotScoreWithMeta = SpotDailyScore & {
  dataStatus: SpotScoreDataStatus
}

// ─── 内部ユーティリティ ─────────────────────────────────────

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'

function isMissingEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url === PLACEHOLDER_URL
}

function getClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

function getTodayJst(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

function withFallbackMeta(
  score: SpotDailyScore,
  reason: SpotScoreDataStatus['reason'],
): SpotScoreWithMeta {
  return {
    ...score,
    dataStatus: {
      source:  'fallback',
      reason,
      message: reason === 'missing-env'
        ? 'Supabase未接続（fallbackデータ）'
        : reason === 'no-data'
        ? 'スコアデータ未生成（fallbackデータ）'
        : 'データ取得エラー（fallbackデータ）',
    },
  }
}

function withRealMeta(score: SpotDailyScore): SpotScoreWithMeta {
  return {
    ...score,
    dataStatus: { source: 'supabase', reason: 'ok', message: '実データ' },
  }
}

// ─── fallback スコア生成 ─────────────────────────────────────

/**
 * Supabase 未設定・データなし時のフォールバック。
 * スポット特性 + 月齢潮汐のみで算出。JMA API は叩かない。
 */
export function getFallbackSpotScores(): SpotDailyScore[] {
  const today   = getTodayJst()
  const now     = new Date(today + 'T00:00:00+09:00')
  const month   = now.getMonth() + 1

  const SEASON_SCORE: Record<number, number> = {
    1: 40, 2: 45, 3: 60, 4: 75, 5: 85, 6: 80,
    7: 70, 8: 65, 9: 80, 10: 75, 11: 65, 12: 45,
  }
  const seasonBase = SEASON_SCORE[month] ?? 60

  const raw: SpotDailyScore[] = getAllFishingSpots().map((spot) => {
    const tide        = getTideSnapshot(spot.prefecture, now)
    const tideScore   = Math.round(tide.tideScore * 10)
    const safetyScore = Math.round(((spot.footSafety + spot.windResistance) / 10) * 100)
    const inSeason    = spot.seasons.includes(month as 1|2|3|4|5|6|7|8|9|10|11|12)
    const seasonScore = inSeason ? seasonBase : Math.round(seasonBase * 0.5)

    const score = Math.max(0, Math.min(100, Math.round(
      tideScore    * 0.25 +
      seasonScore  * 0.35 +
      safetyScore  * 0.20 +
      60           * 0.20  // weather unknown → neutral 60
    )))

    const reasons: string[] = []
    if (tideScore >= 70) reasons.push(`${tide.tideType}で潮通しよい`)
    if (inSeason) reasons.push('シーズン内')
    if (reasons.length === 0) reasons.push('標準的なコンディション')

    const cautions = [
      '※ Supabase未接続のためfallbackデータです',
      '釣果を保証しません',
    ]

    const bestTimeBands = ['朝マズメ', '夕マズメ']
    if (spot.nightFishing) bestTimeBands.push('夜間')

    return {
      spot_id:         spot.id,
      prefecture:      spot.prefecture,
      area:            spot.area,
      valid_date:      today,
      score,
      rank:            null,
      target_fish:     spot.fishTypes[0] ?? '不明',
      best_time_bands: bestTimeBands,
      tide_score:      tideScore,
      season_score:    seasonScore,
      safety_score:    safetyScore,
      weather_score:   null,
      wind_score:      null,
      reasons,
      cautions,
      is_mock:         true,
      data_source:     'fallback-local-spot-score',
      generated_at:    new Date().toISOString(),
    }
  })

  // 都道府県ごとにランク付け
  const byPrefecture = new Map<string, SpotDailyScore[]>()
  for (const s of raw) {
    const arr = byPrefecture.get(s.prefecture) ?? []
    arr.push(s)
    byPrefecture.set(s.prefecture, arr)
  }
  for (const arr of byPrefecture.values()) {
    arr.sort((a, b) => b.score - a.score)
    arr.forEach((s, i) => { s.rank = i + 1 })
  }

  return raw
}

// ─── Supabase クエリ共通 ─────────────────────────────────────

type DbSpotScoreRow = {
  id: string
  spot_id: string
  prefecture: string
  area: string
  valid_date: string
  score: number
  rank: number | null
  target_fish: string
  best_time_bands: string[] | null
  weather_score: number | null
  wind_score: number | null
  tide_score: number | null
  season_score: number | null
  safety_score: number | null
  reasons: string[] | null
  cautions: string[] | null
  is_mock: boolean
  data_source: string
  generated_at: string
}

function dbToScore(row: DbSpotScoreRow): SpotDailyScore {
  return {
    id:              row.id,
    spot_id:         row.spot_id,
    prefecture:      row.prefecture,
    area:            row.area,
    valid_date:      row.valid_date,
    score:           row.score,
    rank:            row.rank,
    target_fish:     row.target_fish,
    best_time_bands: row.best_time_bands,
    weather_score:   row.weather_score,
    wind_score:      row.wind_score,
    tide_score:      row.tide_score,
    season_score:    row.season_score,
    safety_score:    row.safety_score,
    reasons:         row.reasons,
    cautions:        row.cautions,
    is_mock:         row.is_mock,
    data_source:     row.data_source,
    generated_at:    row.generated_at,
  }
}

const SELECT_COLS = [
  'id', 'spot_id', 'prefecture', 'area', 'valid_date', 'score', 'rank',
  'target_fish', 'best_time_bands',
  'weather_score', 'wind_score', 'tide_score', 'season_score', 'safety_score',
  'reasons', 'cautions', 'is_mock', 'data_source', 'generated_at',
].join(', ')

// ─── 公開 API ────────────────────────────────────────────────

/**
 * 全スポットの最新スコアをスコア降順で返す。
 */
export async function getLatestSpotScores(): Promise<SpotScoreWithMeta[]> {
  if (isMissingEnv()) {
    return getFallbackSpotScores().map((s) => withFallbackMeta(s, 'missing-env'))
  }

  const today = getTodayJst()
  try {
    const { data, error } = await getClient()
      .from('spot_daily_scores')
      .select(SELECT_COLS)
      .eq('valid_date', today)
      .order('score', { ascending: false })
      .limit(100)

    if (error || !data || data.length === 0) {
      const reason: SpotScoreDataStatus['reason'] = error ? 'fetch-error' : 'no-data'
      if (error) console.warn('[spotScoreRepository] getLatestSpotScores error:', error.message)
      return getFallbackSpotScores().map((s) => withFallbackMeta(s, reason))
    }

    return (data as unknown as DbSpotScoreRow[]).map((row) => withRealMeta(dbToScore(row)))
  } catch (err) {
    console.warn('[spotScoreRepository] getLatestSpotScores exception:', (err as Error).message)
    return getFallbackSpotScores().map((s) => withFallbackMeta(s, 'fetch-error'))
  }
}

/**
 * 都道府県で絞り込んだスコア一覧（スコア降順）。
 */
export async function getSpotScoresByPrefecture(
  prefecture: string,
): Promise<SpotScoreWithMeta[]> {
  if (isMissingEnv()) {
    return getFallbackSpotScores()
      .filter((s) => s.prefecture === prefecture)
      .map((s) => withFallbackMeta(s, 'missing-env'))
  }

  const today = getTodayJst()
  try {
    const { data, error } = await getClient()
      .from('spot_daily_scores')
      .select(SELECT_COLS)
      .eq('valid_date', today)
      .eq('prefecture', prefecture)
      .order('score', { ascending: false })
      .limit(50)

    if (error || !data || data.length === 0) {
      const reason: SpotScoreDataStatus['reason'] = error ? 'fetch-error' : 'no-data'
      if (error) console.warn('[spotScoreRepository] getSpotScoresByPrefecture error:', error.message)
      return getFallbackSpotScores()
        .filter((s) => s.prefecture === prefecture)
        .map((s) => withFallbackMeta(s, reason))
    }

    return (data as unknown as DbSpotScoreRow[]).map((row) => withRealMeta(dbToScore(row)))
  } catch (err) {
    console.warn('[spotScoreRepository] getSpotScoresByPrefecture exception:', (err as Error).message)
    return getFallbackSpotScores()
      .filter((s) => s.prefecture === prefecture)
      .map((s) => withFallbackMeta(s, 'fetch-error'))
  }
}

/**
 * 都道府県 + エリアで絞り込んだスコア一覧。
 */
export async function getSpotScoresByArea(
  prefecture: string,
  area: string,
): Promise<SpotScoreWithMeta[]> {
  if (isMissingEnv()) {
    return getFallbackSpotScores()
      .filter((s) => s.prefecture === prefecture && s.area === area)
      .map((s) => withFallbackMeta(s, 'missing-env'))
  }

  const today = getTodayJst()
  try {
    const { data, error } = await getClient()
      .from('spot_daily_scores')
      .select(SELECT_COLS)
      .eq('valid_date', today)
      .eq('prefecture', prefecture)
      .eq('area', area)
      .order('score', { ascending: false })
      .limit(20)

    if (error || !data || data.length === 0) {
      const reason: SpotScoreDataStatus['reason'] = error ? 'fetch-error' : 'no-data'
      if (error) console.warn('[spotScoreRepository] getSpotScoresByArea error:', error.message)
      return getFallbackSpotScores()
        .filter((s) => s.prefecture === prefecture && s.area === area)
        .map((s) => withFallbackMeta(s, reason))
    }

    return (data as unknown as DbSpotScoreRow[]).map((row) => withRealMeta(dbToScore(row)))
  } catch (err) {
    console.warn('[spotScoreRepository] getSpotScoresByArea exception:', (err as Error).message)
    return getFallbackSpotScores()
      .filter((s) => s.prefecture === prefecture && s.area === area)
      .map((s) => withFallbackMeta(s, 'fetch-error'))
  }
}

/**
 * spotId で1件取得。見つからない場合は null。
 */
export async function getSpotScoreBySpotId(
  spotId: string,
): Promise<SpotScoreWithMeta | null> {
  if (isMissingEnv()) {
    const fb = getFallbackSpotScores().find((s) => s.spot_id === spotId)
    return fb ? withFallbackMeta(fb, 'missing-env') : null
  }

  const today = getTodayJst()
  try {
    const { data, error } = await getClient()
      .from('spot_daily_scores')
      .select(SELECT_COLS)
      .eq('valid_date', today)
      .eq('spot_id', spotId)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      const reason: SpotScoreDataStatus['reason'] = error ? 'fetch-error' : 'no-data'
      if (error) console.warn('[spotScoreRepository] getSpotScoreBySpotId error:', error.message)
      const fb = getFallbackSpotScores().find((s) => s.spot_id === spotId)
      return fb ? withFallbackMeta(fb, reason) : null
    }

    return withRealMeta(dbToScore(data as unknown as DbSpotScoreRow))
  } catch (err) {
    console.warn('[spotScoreRepository] getSpotScoreBySpotId exception:', (err as Error).message)
    const fb = getFallbackSpotScores().find((s) => s.spot_id === spotId)
    return fb ? withFallbackMeta(fb, 'fetch-error') : null
  }
}
