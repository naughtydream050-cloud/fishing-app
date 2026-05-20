import type { FishId } from './fish'
import type { RegionId } from './region'

export type FishingForecast = {
  regionId: RegionId
  fishId: FishId
  forecastScore: number // 0-100
  weatherSummary: string
  tideSummary: string
  seaTemperature: number
  aiSummary: string
  recommendedGearIds: string[]
  generatedAt: string
}
