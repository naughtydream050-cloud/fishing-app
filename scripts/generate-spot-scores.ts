/**
 * scripts/generate-spot-scores.ts
 *
 * 固定スポット一覧を毎日スコアリングし、spot_daily_scores にupsertする。
 *
 * 実行例:
 *   npx tsx scripts/generate-spot-scores.ts --dry-run   # 保存なし・出力のみ
 *   npx tsx scripts/generate-spot-scores.ts             # Supabase env があれば保存
 *
 * 安全設計:
 *   - DROP / DELETE / TRUNCATE は使用しない
 *   - 1スポット失敗しても continue
 *   - secretはログに出力しない
 *   - lat/lng=0 のスポットは is_mock=true
 *   - Supabase env がない場合は自動でdry-run
 */

import { getAllFishingSpots } from '../data/spots'
import { getJmaWeather } from '../lib/jma'
import { getTideSnapshot } from '../lib/tide'
import type { FishId } from '../types/fish'

// ─── CLI フラグ ────────────────────────────────────────────
const isDryRun = process.argv.includes('--dry-run')

// ─── JST 日付 ─────────────────────────────────────────────
function getTodayJst(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

// ─── 都道府県 → JMA regionId マッピング ──────────────────────
const PREFECTURE_TO_JMA_REGION: Record<string, string> = {
  hiroshima: 'hiroshima',
  tokyo:     'tokyo_23',
  yamaguchi: 'yamaguchi',
  okayama:   'okayama',
}

// ─── スコアリング（scoring.ts の内部関数をインライン実装）────────

// 季節推定 sea temperature (℃) — JMA API なしの簡易推定
function estimateSeaTemp(month: number, prefecture: string): number {
  // 日本海側（yamaguchi北部）は若干低め
  const base =
    prefecture === 'yamaguchi'
      ? [10, 10, 12, 15, 18, 22, 26, 27, 24, 20, 15, 11]
      : [14, 14, 15, 17, 20, 23, 27, 28, 26, 22, 18, 15]
  return base[month - 1] ?? 18
}

const FISH_TEMP_OPTIMAL: Record<FishId, { min: number; max: number; peak: number }> = {
  seabass:    { min: 10, max: 25, peak: 18 },
  aji:        { min: 15, max: 28, peak: 22 },
  mebaru:     { min:  8, max: 20, peak: 14 },
  black_bass: { min: 16, max: 28, peak: 22 },
}

const FISH_PEAK_MONTHS: Record<FishId, number[]> = {
  seabass:    [3, 4, 5, 9, 10, 11],
  aji:        [4, 5, 6, 7, 8, 9],
  mebaru:     [1, 2, 3, 4, 11, 12],
  black_bass: [4, 5, 6, 7, 8, 9, 10],
}

const WIND_CODE_SCORES: Record<string, number> = {
  calm: 100, light: 80, moderate: 40, strong: 10,
}

function calcWeatherScore100(windSpeed: string, precipitation: number): number {
  const wind = WIND_CODE_SCORES[windSpeed] ?? 50
  const rainPenalty = Math.min(precipitation * 5, 50)
  return Math.max(0, Math.min(100, Math.round(wind - rainPenalty)))
}

function calcTempScore100(seaTemp: number, fishId: FishId): number {
  const { min, max, peak } = FISH_TEMP_OPTIMAL[fishId]
  if (seaTemp < min || seaTemp > max) return 0
  const distFromPeak = Math.abs(seaTemp - peak)
  const maxDist = Math.max(peak - min, max - peak)
  return Math.max(0, Math.min(100, Math.round(100 * (1 - distFromPeak / maxDist))))
}

function calcSeasonScore100(fishId: FishId, month: number): number {
  const peaks = FISH_PEAK_MONTHS[fishId]
  if (peaks.includes(month)) return 100
  if (peaks.includes(month - 1) || peaks.includes(month + 1)) return 60
  return 20
}

// 足場・風耐性によるスポット安全補正（0〜100）
function calcSafetyScore100(footSafety: number, windResistance: number): number {
  return Math.round(((footSafety + windResistance) / 10) * 100)
}

// best_time_bands を nightFishing と月齢から決定
function calcBestTimeBands(nightFishing: boolean, tideScore: number): string[] {
  const bands: string[] = ['朝マズメ', '夕マズメ']
  if (nightFishing && tideScore >= 7) bands.push('夜間')
  return bands
}

// reasons / cautions テキスト生成
function buildReasons(
  weatherScore: number,
  tideType: string,
  tideScore: number,
  seasonScore: number,
): string[] {
  const r: string[] = []
  if (tideScore >= 7) r.push(`${tideType}で潮通しよい`)
  if (tideScore <= 3) r.push(`${tideType}で潮動き小さめ`)
  if (weatherScore >= 80) r.push('天候良好、釣りやすいコンディション')
  if (weatherScore <= 40) r.push('天候不良のため活性低下の可能性あり')
  if (seasonScore >= 80) r.push('シーズンのピーク期')
  if (seasonScore <= 20) r.push('シーズンオフのため釣果期待低め')
  if (r.length === 0) r.push('標準的なコンディション')
  return r
}

function buildCautions(
  isMock: boolean,
  windSpeed: string,
  spot: ReturnType<typeof getAllFishingSpots>[number],
): string[] {
  const c: string[] = []
  if (isMock) c.push('位置情報未確認のため気象データは参考値')
  if (windSpeed === 'strong') c.push('強風注意、釣行中止を検討')
  if (windSpeed === 'moderate') c.push('風やや強め、ライフジャケット着用推奨')
  if (spot.warnings) c.push(...spot.warnings.filter(w => !w.startsWith('lat/lng')))
  return c
}

// ─── スコア計算（1スポット） ────────────────────────────────

type SpotDailyScoreRow = {
  spot_id: string
  prefecture: string
  area: string
  valid_date: string
  score: number
  rank: null
  target_fish: string
  best_time_bands: string[]
  weather_score: number
  wind_score: number
  tide_score: number
  season_score: number
  safety_score: number
  reasons: string[]
  cautions: string[]
  is_mock: boolean
  data_source: string
  generated_at: string
}

async function scoreSpot(
  spot: ReturnType<typeof getAllFishingSpots>[number],
  validDate: string,
): Promise<SpotDailyScoreRow> {
  const date = new Date(validDate + 'T00:00:00+09:00')
  const month = date.getMonth() + 1
  const isMock = spot.lat === 0 && spot.lng === 0

  // 優先魚種決定
  const primaryFishId = spot.targetFishIds[0] ?? null
  const targetFishName = spot.fishTypes[0] ?? '不明'

  // JMA 天気取得（失敗時フォールバック）
  const jmaRegionId = PREFECTURE_TO_JMA_REGION[spot.prefecture]
  let windSpeed: string = 'calm'
  let precipitation = 0
  let weatherText = '不明'
  let dataSource = 'lunar-tide+rule-score'

  if (jmaRegionId && !isMock) {
    try {
      const weather = await getJmaWeather(jmaRegionId)
      windSpeed    = weather.windSpeed
      precipitation = weather.precipitation
      weatherText  = weather.weatherText
      dataSource   = 'jma+lunar-tide+rule-score'
    } catch {
      // JMA 失敗 → フォールバック（is_mock はここでは変えない）
      dataSource = 'lunar-tide+rule-score(jma-fallback)'
    }
  }

  // 潮取得
  const tide = getTideSnapshot(spot.prefecture, date)

  // 各スコア計算（0〜100）
  const weatherScore = calcWeatherScore100(windSpeed, precipitation)
  const windScore    = WIND_CODE_SCORES[windSpeed] ?? 50
  const tideScore    = Math.round(tide.tideScore * 10)   // 0-10 → 0-100
  const seaTemp      = estimateSeaTemp(month, spot.prefecture)
  const tempScore    = primaryFishId ? calcTempScore100(seaTemp, primaryFishId) : 50
  const seasonScore  = primaryFishId ? calcSeasonScore100(primaryFishId, month) : 50
  const safetyScore  = calcSafetyScore100(spot.footSafety, spot.windResistance)

  // 安全補正係数（windResistance が低いスポットは強風時にスコアを下げる）
  const windPenalty = windSpeed === 'strong'   ? (1 - (spot.windResistance - 1) * 0.1) :
                      windSpeed === 'moderate' ? (1 - (spot.windResistance - 1) * 0.05) : 1.0
  const safetyMultiplier = Math.max(0.5, Math.min(1.0, windPenalty))

  // 総合スコア（weighted sum、security補正後）
  const rawScore =
    weatherScore * 0.30 +
    tideScore    * 0.25 +
    tempScore    * 0.25 +
    seasonScore  * 0.20

  const score = Math.max(0, Math.min(100, Math.round(rawScore * safetyMultiplier)))

  const bestTimeBands = calcBestTimeBands(spot.nightFishing, tide.tideScore)
  const reasons       = buildReasons(weatherScore, tide.tideType, tide.tideScore, seasonScore)
  const cautions      = buildCautions(isMock, windSpeed, spot)

  return {
    spot_id:         spot.id,
    prefecture:      spot.prefecture,
    area:            spot.area,
    valid_date:      validDate,
    score,
    rank:            null,
    target_fish:     targetFishName,
    best_time_bands: bestTimeBands,
    weather_score:   weatherScore,
    wind_score:      windScore,
    tide_score:      tideScore,
    season_score:    seasonScore,
    safety_score:    safetyScore,
    reasons,
    cautions,
    is_mock:         isMock || dataSource.includes('fallback'),
    data_source:     isMock ? 'mock' : dataSource,
    generated_at:    new Date().toISOString(),
  }
}

// ─── Supabase upsert ───────────────────────────────────────

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // Dynamic import で supabase-js を使う
  const { createClient } = require('@supabase/supabase-js') // eslint-disable-line @typescript-eslint/no-require-imports
  return createClient(url, key, { auth: { persistSession: false } })
}

async function upsertRows(rows: SpotDailyScoreRow[]): Promise<void> {
  const client = getSupabaseClient()
  if (!client) {
    console.log('[upsert] SKIP: Supabase env not configured')
    return
  }
  const { error } = await client
    .from('spot_daily_scores')
    .upsert(rows, { onConflict: 'spot_id,valid_date' })
  if (error) {
    throw new Error(`[upsert] Supabase error: ${error.message}`)
  }
  console.log(`[upsert] ${rows.length} rows saved to spot_daily_scores`)
}

// ─── メイン ────────────────────────────────────────────────

async function main() {
  const validDate = getTodayJst()
  const spots = getAllFishingSpots()

  console.log(`\n=== generate-spot-scores ===`)
  console.log(`valid_date : ${validDate}`)
  console.log(`dry_run    : ${isDryRun}`)
  console.log(`spots      : ${spots.length}`)
  console.log(`supabase   : ${getSupabaseClient() ? 'configured' : 'not configured (dry-run forced)'}`)
  console.log(`============================================\n`)

  const results: SpotDailyScoreRow[] = []
  let successCount = 0
  let skipCount = 0

  for (const spot of spots) {
    try {
      const row = await scoreSpot(spot, validDate)
      results.push(row)
      successCount++

      // dry-run 出力
      console.log(
        `[${successCount.toString().padStart(2)}] ${spot.name.padEnd(12)} ` +
        `score=${String(row.score).padStart(3)} ` +
        `fish=${row.target_fish} ` +
        `tide=${row.tide_score} ` +
        `weather=${row.weather_score} ` +
        `mock=${row.is_mock} ` +
        `reasons=[${row.reasons.join(' / ')}]`
      )
    } catch (err) {
      skipCount++
      console.error(`[SKIP] ${spot.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\n--- 結果 ---`)
  console.log(`成功: ${successCount} / ${spots.length}`)
  console.log(`スキップ: ${skipCount}`)

  if (!isDryRun && results.length > 0) {
    await upsertRows(results)
  } else {
    console.log('[upsert] dry-run のため保存をスキップ')
  }

  console.log('\n完了')
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
