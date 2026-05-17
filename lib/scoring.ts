/**
 * Deterministic forecast scoring engine
 *
 * GPT direction: "deterministic first, AI is only the last step"
 *
 * Score = weather(30%) + tide(25%) + temperature(25%) + season(20%)
 * Range: 0-100
 */

import type { JmaWeatherSnapshot } from './jma'
import type { TideSnapshot } from './tide'
import type { RegionId } from '@/types/region'
import type { FishId } from '@/types/fish'

// Sea temperature ranges per fish species (optimal range)
const FISH_TEMP_OPTIMAL: Record<FishId, { min: number; max: number; peak: number }> = {
  seabass:    { min: 10, max: 25, peak: 18 },  // シーバス
  aji:        { min: 15, max: 28, peak: 22 },  // アジ
  mebaru:     { min:  8, max: 20, peak: 14 },  // メバル
  black_bass: { min: 16, max: 28, peak: 22 },  // ブラックバス
}

// Season score: which months each fish is most active (1-indexed)
const FISH_PEAK_MONTHS: Record<FishId, number[]> = {
  seabass:    [3, 4, 5, 9, 10, 11],      // spring & autumn
  aji:        [4, 5, 6, 7, 8, 9],        // spring–summer
  mebaru:     [1, 2, 3, 4, 11, 12],      // winter–early spring
  black_bass: [4, 5, 6, 7, 8, 9, 10],   // spring–autumn
}

// Weather code → weather score (0-10)
const WEATHER_CODE_SCORES: Record<string, number> = {
  calm: 10,
  light: 8,
  moderate: 4,
  strong: 1,
}

function calcWeatherScore(weather: JmaWeatherSnapshot): number {
  // Wind impact (0-10)
  const windScore = WEATHER_CODE_SCORES[weather.windSpeed] ?? 5
  // Rain penalty
  const rainPenalty = Math.min(weather.precipitation / 10, 5)
  // Combine: sunny + calm = best
  const raw = (windScore - rainPenalty)
  return Math.max(0, Math.min(10, raw))
}

function calcTemperatureScore(seaTemp: number, fishId: FishId): number {
  const { min, max, peak } = FISH_TEMP_OPTIMAL[fishId]
  if (seaTemp < min || seaTemp > max) return 0
  // Distance from peak temperature
  const distFromPeak = Math.abs(seaTemp - peak)
  const maxDist = Math.max(peak - min, max - peak)
  const score = 10 * (1 - distFromPeak / maxDist)
  return Math.max(0, Math.min(10, score))
}

function calcSeasonScore(fishId: FishId, date?: Date): number {
  const month = (date ?? new Date()).getMonth() + 1 // 1-indexed
  const peakMonths = FISH_PEAK_MONTHS[fishId]
  if (peakMonths.includes(month)) return 10
  // Check adjacent months for partial credit
  if (peakMonths.includes(month - 1) || peakMonths.includes(month + 1)) return 6
  return 2
}

export type ForecastInput = {
  regionId: RegionId
  fishId: FishId
  weather: JmaWeatherSnapshot
  tide: TideSnapshot
  seaTemperature: number
  date?: Date
}

export type ForecastScore = {
  regionId: RegionId
  fishId: FishId
  forecastScore: number   // 0-100
  scoreBreakdown: {
    weather: number
    tide: number
    temperature: number
    season: number
  }
  weatherSummary: string
  tideSummary: string
  seaTemperature: number
  forecastDate: string
}

export function calcForecastScore(input: ForecastInput): ForecastScore {
  const { regionId, fishId, weather, tide, seaTemperature, date } = input
  const d = date ?? new Date()

  const weatherScore   = calcWeatherScore(weather)         // 0-10
  const tideScore      = tide.tideScore                    // 0-10 (from tide.ts)
  const tempScore      = calcTemperatureScore(seaTemperature, fishId)  // 0-10
  const seasonScore    = calcSeasonScore(fishId, d)        // 0-10

  // Weighted sum → 0-100
  const total = Math.round(
    weatherScore   * 3.0 +   // 30%
    tideScore      * 2.5 +   // 25%
    tempScore      * 2.5 +   // 25%
    seasonScore    * 2.0     // 20%
  )

  const forecastScore = Math.max(0, Math.min(100, total))

  const tideSummaryText =
    `${tide.tideType}（${forecastScore >= 70 ? '良好' : forecastScore >= 40 ? '普通' : '低調'}）`

  return {
    regionId,
    fishId,
    forecastScore,
    scoreBreakdown: {
      weather:     Math.round(weatherScore * 10),
      tide:        Math.round(tideScore * 10),
      temperature: Math.round(tempScore * 10),
      season:      Math.round(seasonScore * 10),
    },
    weatherSummary: weather.weatherText,
    tideSummary: tideSummaryText,
    seaTemperature,
    forecastDate: d.toISOString().slice(0, 10),
  }
}
