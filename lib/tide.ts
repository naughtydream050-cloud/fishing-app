/**
 * Tide information module
 *
 * Uses astronomical tide approximation (synodic moon cycle).
 * JCG real-time tide JSON is not freely available without registration.
 * This deterministic approach gives consistent results without API rate limits.
 *
 * Tide type → fishing score:
 *   大潮 (spring): 10  ← best fishing
 *   中潮 (neap→spring): 7
 *   小潮 (neap): 4
 *   長潮 (stand): 2
 *   若潮 (recovering): 3
 */

export type TideSnapshot = {
  regionId: string
  date: string
  tideType: '大潮' | '中潮' | '小潮' | '長潮' | '若潮'
  tideScore: number // 0-10
  description: string
}

// Reference new moon: 2024-01-11 (known new moon date)
const REFERENCE_NEW_MOON = new Date('2024-01-11T00:00:00Z')
const SYNODIC_MONTH_DAYS = 29.53059

function getMoonAge(date: Date): number {
  const diffMs = date.getTime() - REFERENCE_NEW_MOON.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return ((diffDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS
}

function getTideType(moonAge: number): TideSnapshot['tideType'] {
  // Spring tides: new moon (0-2) and full moon (13-15)
  // Neap tides: quarter moons (6-8, 21-23)
  if (moonAge <= 2 || moonAge >= 27.5 || (moonAge >= 13 && moonAge <= 15)) {
    return '大潮'
  }
  if ((moonAge >= 2.1 && moonAge <= 5.9) || (moonAge >= 15.1 && moonAge <= 18.9)) {
    return '中潮'
  }
  if ((moonAge >= 6 && moonAge <= 8) || (moonAge >= 21 && moonAge <= 23)) {
    return '小潮'
  }
  if (moonAge === 8.5 || moonAge === 23.5 || (moonAge > 8 && moonAge < 9) || (moonAge > 23 && moonAge < 24)) {
    return '長潮'
  }
  if ((moonAge >= 9 && moonAge <= 10) || (moonAge >= 24 && moonAge <= 25)) {
    return '若潮'
  }
  return '中潮'
}

const TIDE_SCORES: Record<TideSnapshot['tideType'], number> = {
  大潮: 10,
  中潮: 7,
  小潮: 4,
  長潮: 2,
  若潮: 3,
}

const TIDE_DESCRIPTIONS: Record<TideSnapshot['tideType'], string> = {
  大潮: '大潮・潮の動きが最大。フィッシュイーターが活発になる好機。',
  中潮: '中潮・安定した潮流。広範囲で魚の活性が期待できます。',
  小潮: '小潮・潮の動きが少なめ。ポイントを絞った釣りが有効。',
  長潮: '長潮・潮止まり近く。魚の活性が低め、ルアーサイズを落とすと◎',
  若潮: '若潮・潮が回復傾向。夕マズメ以降は期待できます。',
}

export function getTideSnapshot(regionId: string, date?: Date): TideSnapshot {
  const d = date ?? new Date()
  const moonAge = getMoonAge(d)
  const tideType = getTideType(moonAge)
  const tideScore = TIDE_SCORES[tideType]

  return {
    regionId,
    date: d.toISOString().slice(0, 10),
    tideType,
    tideScore,
    description: TIDE_DESCRIPTIONS[tideType],
  }
}

export function getAllRegionTides(regionIds: string[], date?: Date): TideSnapshot[] {
  return regionIds.map((id) => getTideSnapshot(id, date))
}
