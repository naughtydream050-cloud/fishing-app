/**
 * Forecast data access layer
 * Fetches from Supabase regional_forecasts table, falls back to mock data
 */

import { supabase } from './supabase'
import { MOCK_FORECASTS } from './mockForecasts'
import type { FishingForecast } from '@/types/forecast'
import type { RegionId } from '@/types/region'
import type { FishId } from '@/types/fish'

type DbForecast = {
  region_id: string
  fish_id: string
  forecast_score: number
  weather_summary: string
  tide_summary: string
  sea_temperature: number
  ai_summary: string
  generated_at: string
}

function dbToForecast(row: DbForecast): FishingForecast {
  return {
    regionId:        row.region_id as RegionId,
    fishId:          row.fish_id as FishId,
    forecastScore:   row.forecast_score,
    weatherSummary:  row.weather_summary,
    tideSummary:     row.tide_summary,
    seaTemperature:  row.sea_temperature,
    aiSummary:       row.ai_summary,
    recommendedGearIds: [],
    generatedAt:     row.generated_at,
  }
}

const USE_MOCK = process.env.USE_MOCK_DATA === 'true'

export async function getForecastsForRegion(regionId: string): Promise<FishingForecast[]> {
  if (USE_MOCK) return MOCK_FORECASTS.filter((f) => f.regionId === regionId)

  const { data, error } = await supabase
    .from('regional_forecasts')
    .select('region_id, fish_id, forecast_score, weather_summary, tide_summary, sea_temperature, ai_summary, generated_at')
    .eq('region_id', regionId)
    .order('forecast_date', { ascending: false })
    .limit(20)

  if (error || !data || data.length === 0) {
    console.warn(`[forecasts] Supabase fetch failed for ${regionId}, using mock:`, error?.message)
    return MOCK_FORECASTS.filter((f) => f.regionId === regionId)
  }

  // Deduplicate: keep only the latest forecast per fish
  const seen = new Set<string>()
  const latest: FishingForecast[] = []
  for (const row of data) {
    if (!seen.has(row.fish_id)) {
      seen.add(row.fish_id)
      latest.push(dbToForecast(row as DbForecast))
    }
  }
  return latest
}

export async function getForecastForFish(
  regionId: string,
  fishId: string
): Promise<FishingForecast | null> {
  if (USE_MOCK) {
    return MOCK_FORECASTS.find((f) => f.regionId === regionId && f.fishId === fishId) ?? null
  }

  const { data, error } = await supabase
    .from('regional_forecasts')
    .select('region_id, fish_id, forecast_score, weather_summary, tide_summary, sea_temperature, ai_summary, generated_at')
    .eq('region_id', regionId)
    .eq('fish_id', fishId)
    .order('forecast_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.warn(`[forecasts] No data for ${regionId}/${fishId}, using mock:`, error?.message)
    return MOCK_FORECASTS.find((f) => f.regionId === regionId && f.fishId === fishId) ?? null
  }

  return dbToForecast(data as DbForecast)
}
