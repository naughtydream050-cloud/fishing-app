/**
 * Forecast repository — Supabase-first with mock fallback
 * Returns isMock + dataStatus so UI can render DataSourceBadge.
 */

import { createClient } from '@supabase/supabase-js'
import { MOCK_FORECASTS } from './mockForecasts'
import type { FishingForecast } from '@/types/forecast'
import type { RegionId } from '@/types/region'

import type { FishId } from '@/types/fish'
export type DataStatus = {
  source: 'supabase' | 'mock'
  reason: 'ok' | 'USE_MOCK_DATA=true' | 'missing-env' | 'no-data' | 'fetch-error'
  message: string
}

export type ForecastWithMeta = FishingForecast & {
  validDate: string
  dataSource: string
  isMock: boolean
  dataStatus: DataStatus
}

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'

function isMissingEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url === PLACEHOLDER_URL
}

function withTideSuffix(tideSummary: string): string {
  if (tideSummary.includes('簡易潮回り推定')) return tideSummary
  return `${tideSummary}（簡易潮回り推定）`
}

function formatJST(isoString: string): string {
  const d = new Date(isoString)
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = jst.getUTCFullYear()
  const mo = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const dy = String(jst.getUTCDate()).padStart(2, '0')
  const h = String(jst.getUTCHours()).padStart(2, '0')
  const mi = String(jst.getUTCMinutes()).padStart(2, '0')
  return `${y}/${mo}/${dy} ${h}:${mi}`
}

function toMockMeta(f: FishingForecast, reason: DataStatus['reason']): ForecastWithMeta {
  return {
    ...f,
    tideSummary: withTideSuffix(f.tideSummary),
    validDate:   new Date().toISOString().slice(0, 10),
    dataSource:  'mock',
    isMock: true,
    dataStatus: {
      source: 'mock',
      reason,
      message: 'デモデータ（本番データ未接続）',
    },
  }
}

function toRealMeta(f: FishingForecast): ForecastWithMeta {
  return {
    ...f,
    validDate:  f.generatedAt.slice(0, 10),
    dataSource: 'supabase',
    isMock: false,
    dataStatus: {
      source: 'supabase',
      reason: 'ok',
      message: `実データ更新: ${formatJST(f.generatedAt)}`,
    },
  }
}

type DbRow = {
  region_id: string
  fish_id: string
  forecast_score: number
  weather_summary: string
  tide_summary: string
  sea_temperature: number
  ai_summary: string
  generated_at: string
}

function dbToForecast(row: DbRow): FishingForecast {
  return {
    regionId: row.region_id as RegionId,
    fishId: row.fish_id as FishId,
    forecastScore: row.forecast_score,
    weatherSummary: row.weather_summary,
    tideSummary: row.tide_summary,
    seaTemperature: row.sea_temperature,
    aiSummary: row.ai_summary,
    recommendedGearIds: [],
    generatedAt: row.generated_at,
  }
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function getRegionalForecastsByRegion(regionId: string): Promise<ForecastWithMeta[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_FORECASTS
      .filter((f) => f.regionId === regionId)
      .map((f) => toMockMeta(f, 'USE_MOCK_DATA=true'))
  }

  if (isMissingEnv()) {
    return MOCK_FORECASTS
      .filter((f) => f.regionId === regionId)
      .map((f) => toMockMeta(f, 'missing-env'))
  }

  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('regional_forecasts')
      .select('region_id, fish_id, forecast_score, weather_summary, tide_summary, sea_temperature, ai_summary, generated_at')
      .eq('region_id', regionId)
      .order('forecast_date', { ascending: false })
      .limit(20)

    if (error || !data || data.length === 0) {
      const reason: DataStatus['reason'] = error ? 'fetch-error' : 'no-data'
      if (error) console.warn(`[forecastRepository] Supabase error for ${regionId}:`, error.message)
      return MOCK_FORECASTS
        .filter((f) => f.regionId === regionId)
        .map((f) => toMockMeta(f, reason))
    }

    const seen = new Set<string>()
    const result: ForecastWithMeta[] = []
    for (const row of data) {
      if (!seen.has(row.fish_id)) {
        seen.add(row.fish_id)
        result.push(toRealMeta(dbToForecast(row as DbRow)))
      }
    }
    return result
  } catch {
    return MOCK_FORECASTS
      .filter((f) => f.regionId === regionId)
      .map((f) => toMockMeta(f, 'fetch-error'))
  }
}

export async function getLatestRegionalForecasts(): Promise<ForecastWithMeta[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_FORECASTS.map((f) => toMockMeta(f, 'USE_MOCK_DATA=true'))
  }

  if (isMissingEnv()) {
    return MOCK_FORECASTS.map((f) => toMockMeta(f, 'missing-env'))
  }

  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('regional_forecasts')
      .select('region_id, fish_id, forecast_score, weather_summary, tide_summary, sea_temperature, ai_summary, generated_at')
      .order('forecast_date', { ascending: false })
      .limit(80)

    if (error || !data || data.length === 0) {
      const reason: DataStatus['reason'] = error ? 'fetch-error' : 'no-data'
      return MOCK_FORECASTS.map((f) => toMockMeta(f, reason))
    }

    const seen = new Set<string>()
    const result: ForecastWithMeta[] = []
    for (const row of data) {
      const key = `${row.region_id}:${row.fish_id}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push(toRealMeta(dbToForecast(row as DbRow)))
      }
    }
    return result
  } catch {
    return MOCK_FORECASTS.map((f) => toMockMeta(f, 'fetch-error'))
  }
}

export async function getForecastDataSourceStatus(): Promise<{
  isLive: boolean
  lastUpdated: string | null
  reason: string
}> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return { isLive: false, lastUpdated: null, reason: 'USE_MOCK_DATA=true' }
  }
  if (isMissingEnv()) {
    return { isLive: false, lastUpdated: null, reason: '環境変数未設定（デモモード）' }
  }
  try {
    const sb = getClient()
    const { data, error } = await sb
      .from('regional_forecasts')
      .select('generated_at')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) return { isLive: false, lastUpdated: null, reason: 'データなし' }
    return { isLive: true, lastUpdated: formatJST(data.generated_at), reason: 'ok' }
  } catch {
    return { isLive: false, lastUpdated: null, reason: '接続エラー' }
  }
}
