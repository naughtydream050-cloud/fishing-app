/**
 * JMA (Japan Meteorological Agency) weather data fetcher
 * Free JSON API: https://www.jma.go.jp/bosai/forecast/data/forecast/{code}.json
 *
 * Area codes:
 *   東京: 130000, 岡山: 330000, 広島: 340000, 山口: 350000
 */

export type JmaWeatherSnapshot = {
  regionId: string
  date: string // YYYY-MM-DD
  weatherCode: string
  weatherText: string
  windSpeed: 'calm' | 'light' | 'moderate' | 'strong'
  precipitation: number // mm/day estimate (0-100)
  fetchedAt: string
}

const JMA_AREA_CODES: Record<string, string> = {
  tokyo_23: '130000',
  okayama:  '330000',
  hiroshima: '340000',
  yamaguchi: '350000',
}

// JMA weather code → simplified weather text
function parseWeatherCode(code: string): { text: string; score: number } {
  const n = parseInt(code, 10)
  if (n === 100 || n === 101) return { text: '晴れ', score: 10 }
  if (n >= 102 && n <= 111) return { text: '晴れ時々曇り', score: 7 }
  if (n === 200 || n === 201) return { text: '曇り', score: 5 }
  if (n >= 202 && n <= 211) return { text: '曇り時々雨', score: 3 }
  if (n >= 300 && n <= 313) return { text: '雨', score: 1 }
  if (n >= 400 && n <= 413) return { text: '雪', score: 0 }
  return { text: '不明', score: 5 }
}

function parseWindScore(description: string): JmaWeatherSnapshot['windSpeed'] {
  if (/強風|暴風/.test(description)) return 'strong'
  if (/やや強い|強め/.test(description)) return 'moderate'
  if (/弱い|微風/.test(description)) return 'light'
  return 'calm'
}

async function fetchJmaForecast(areaCode: string): Promise<unknown> {
  const url = `https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'fishing-forecast-bot/1.0' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    throw new Error(`JMA fetch failed: ${res.status} ${url}`)
  }
  return res.json()
}

export async function getJmaWeather(regionId: string): Promise<JmaWeatherSnapshot> {
  const areaCode = JMA_AREA_CODES[regionId]
  if (!areaCode) {
    throw new Error(`Unknown regionId: ${regionId}`)
  }

  const now = new Date()
  const date = now.toISOString().slice(0, 10)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchJmaForecast(areaCode) as any

    // JMA response: array of forecasting offices, take the first one
    const timeSeries = data[0]?.timeSeries
    if (!timeSeries || timeSeries.length === 0) {
      throw new Error('No timeSeries in JMA response')
    }

    // timeSeries[0]: weather codes
    const weatherCodes = timeSeries[0]?.areas?.[0]?.weatherCodes
    const weatherTexts = timeSeries[0]?.areas?.[0]?.weathers
    const winds = timeSeries[0]?.areas?.[0]?.winds

    const todayCode = weatherCodes?.[0] ?? '100'
    const todayText = weatherTexts?.[0] ?? '晴れ'
    const todayWind = winds?.[0] ?? ''

    const { text } = parseWeatherCode(todayCode)

    return {
      regionId,
      date,
      weatherCode: todayCode,
      weatherText: text || todayText.replace(/　/g, ' ').slice(0, 20),
      windSpeed: parseWindScore(todayWind),
      precipitation: 0,
      fetchedAt: now.toISOString(),
    }
  } catch (err) {
    console.error(`[JMA] Failed for ${regionId}:`, err)
    // Graceful fallback — don't crash the pipeline
    return {
      regionId,
      date,
      weatherCode: '100',
      weatherText: '晴れ（データ取得失敗）',
      windSpeed: 'light',
      precipitation: 0,
      fetchedAt: now.toISOString(),
    }
  }
}

export async function getAllRegionWeather(): Promise<JmaWeatherSnapshot[]> {
  const regionIds = Object.keys(JMA_AREA_CODES)
  const results = await Promise.allSettled(regionIds.map(getJmaWeather))

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    console.error(`[JMA] ${regionIds[i]} failed:`, r.reason)
    return {
      regionId: regionIds[i],
      date: new Date().toISOString().slice(0, 10),
      weatherCode: '100',
      weatherText: '晴れ',
      windSpeed: 'calm' as const,
      precipitation: 0,
      fetchedAt: new Date().toISOString(),
    }
  })
}
