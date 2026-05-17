#!/usr/bin/env tsx
/**
 * Daily forecast pipeline — deterministic, zero-LLM-runtime
 *
 * Design principles:
 *  - No runtime LLM dependency (Ollama/Qwen = dev tools only, NOT production)
 *  - Free public APIs: JMA weather, astronomical tide
 *  - Deterministic scoring + templated text generation
 *  - Score change threshold: skip rewrite if delta <= SCORE_THRESHOLD
 *  - pipeline_runs tracking for observability
 *  - Works autonomously 24/7 with near-zero infra cost
 *
 * Run: npx tsx --env-file=.env.local scripts/generate-forecasts.ts
 * CI:  .github/workflows/forecast-cron.yml (daily 05:00 JST)
 */

import { createClient } from '@supabase/supabase-js'
import { getJmaWeather } from '../lib/jma'
import { getTideSnapshot } from '../lib/tide'
import { calcForecastScore } from '../lib/scoring'
import type { RegionId } from '../types/region'
import type { FishId } from '../types/fish'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const SCORE_THRESHOLD = 5
const INDEX_MIN_SCORE = 40

const REGIONS: { id: RegionId; displayName: string; seaTempBase: number }[] = [
  { id: 'tokyo_23' as RegionId,  displayName: '東京23区', seaTempBase: 17.5 },
  { id: 'hiroshima' as RegionId, displayName: '広島',     seaTempBase: 18.2 },
  { id: 'yamaguchi' as RegionId, displayName: '山口',     seaTempBase: 16.8 },
  { id: 'okayama' as RegionId,   displayName: '岡山',     seaTempBase: 19.0 },
]

const FISH: { id: FishId; displayName: string }[] = [
  { id: 'seabass' as FishId,    displayName: 'シーバス' },
  { id: 'aji' as FishId,        displayName: 'アジ' },
  { id: 'mebaru' as FishId,     displayName: 'メバル' },
  { id: 'black_bass' as FishId, displayName: 'ブラックバス' },
]

function estimateSeaTemp(baseTemp: number): number {
  const month = new Date().getMonth() + 1
  const offset = Math.round(4 * Math.sin((month - 2) * Math.PI / 6) * 10) / 10
  return Math.round((baseTemp + offset) * 10) / 10
}

function generateSummary(params: {
  regionName: string
  fishName: string
  score: number
  weather: string
  tide: string
  seaTemp: number
}): string {
  const { regionName, fishName, score, tide, seaTemp } = params
  const activity = score >= 75 ? '非常に高い' : score >= 60 ? '高い' : score >= 40 ? '普通' : '低め'
  const timing = score >= 70 ? '夕マズメ17〜19時が最大のチャンス。' : score >= 50 ? '朝まずめと夕マズメを狙いましょう。' : '朝まずめ5〜7時に集中しましょう。'
  const tideNote = (tide.includes('大潮') || tide.includes('中潮')) ? '潮通しが良く好条件。' : '潮の動きが弱め、流れを意識して探ろう。'
  const tempNote = seaTemp >= 20 ? `海水温${seaTemp}℃と温暖。` : seaTemp >= 15 ? `海水温${seaTemp}℃で安定。` : `海水温${seaTemp}℃とやや低め。`
  return `${regionName}の${fishName}活性は${activity}。${tempNote}${tideNote}${timing}`
}

async function run() {
  const t0 = Date.now()
  console.log(`[pipeline] Start ${new Date().toISOString()} mode=deterministic`)

  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars')
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
  const today = new Date().toISOString().slice(0, 10)

  const { data: runRow } = await sb
    .from('pipeline_runs')
    .insert({ started_at: new Date().toISOString() })
    .select('id')
    .single()
  const runId: string | null = runRow?.id ?? null

  let generated = 0, skipped = 0, failures = 0

  for (const region of REGIONS) {
    console.log(`\n[region] ${region.displayName}`)
    const weather = await getJmaWeather(region.id)
    const tide    = getTideSnapshot(region.id)
    const seaTemp = estimateSeaTemp(region.seaTempBase)
    console.log(`  weather=${weather.weatherText} tide=${tide.tideType} seaTemp=${seaTemp}C`)

    for (const fish of FISH) {
      try {
        const scored = calcForecastScore({ regionId: region.id, fishId: fish.id, weather, tide, seaTemperature: seaTemp })

        const { data: prev } = await sb
          .from('regional_forecasts')
          .select('forecast_score, ai_summary')
          .eq('region_id', region.id)
          .eq('fish_id', fish.id)
          .order('forecast_date', { ascending: false })
          .limit(1)
          .single()

        const prevScore  = prev?.forecast_score ?? null
        const scoreDelta = prevScore !== null ? Math.abs(scored.forecastScore - prevScore) : Infinity
        const shouldRegen = scoreDelta > SCORE_THRESHOLD

        let summary: string
        if (shouldRegen || !prev?.ai_summary) {
          summary = generateSummary({
            regionName: region.displayName,
            fishName: fish.displayName,
            score: scored.forecastScore,
            weather: scored.weatherSummary,
            tide: tide.tideType,
            seaTemp: scored.seaTemperature,
          })
          generated++
          console.log(`  [gen] ${fish.displayName} score=${scored.forecastScore}`)
        } else {
          summary = prev.ai_summary
          skipped++
          console.log(`  [skip] ${fish.displayName} delta=${scoreDelta}`)
        }

        const shouldIndex = scored.forecastScore >= INDEX_MIN_SCORE
        const { error } = await sb.from('regional_forecasts').upsert({
          region_id:       region.id,
          fish_id:         fish.id,
          forecast_date:   today,
          forecast_score:  scored.forecastScore,
          weather_summary: scored.weatherSummary,
          tide_summary:    tide.tideType,
          sea_temperature: scored.seaTemperature,
          ai_summary:      summary,
          generated_at:    new Date().toISOString(),
        }, { onConflict: 'region_id,fish_id,forecast_date' })

        if (error) { console.error(`  [error] ${fish.displayName}: ${error.message}`); failures++ }
        else { console.log(`  ok score=${scored.forecastScore} index=${shouldIndex}`) }

      } catch (err) {
        console.error(`  [fatal] ${region.id}/${fish.id}:`, err)
        failures++
      }
    }
  }

  const totalMs = Date.now() - t0
  if (runId) {
    await sb.from('pipeline_runs').update({
      completed_at:      new Date().toISOString(),
      regions_processed: REGIONS.length,
      generation_count:  generated,
      skipped_count:     skipped,
      failures,
      llm_duration_ms:   0,
      status:            failures === 0 ? 'success' : 'partial',
    }).eq('id', runId)
  }

  console.log(`\n[pipeline] Done in ${(totalMs / 1000).toFixed(1)}s  generated=${generated} skipped=${skipped} failures=${failures}`)
  if (failures > 0 && failures === REGIONS.length * FISH.length) process.exit(1)
}

run().catch((err) => { console.error('[pipeline] Fatal:', err); process.exit(1) })
