import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSpotScoresByPrefecture } from '@/lib/spotScoreRepository'
import { getSubscriptionTier, FREE_SPOT_LIMIT } from '@/lib/subscription'
import { getAllFishingSpots } from '@/data/spots'

export const revalidate = 0  // SSR — 常に最新スコア

// ─── 都道府県マスタ ──────────────────────────────────────────

const PREFECTURE_INFO: Record<string, {
  displayName: string
  region: string
  description: string
}> = {
  hiroshima: {
    displayName: '広島県',
    region: '中国地方',
    description: '瀬戸内海の穏やかな海に面した広島県の釣りスポット。チヌ・メバル・アオリイカが人気。',
  },
  okayama: {
    displayName: '岡山県',
    region: '中国地方',
    description: '干満差が大きい瀬戸内。潮のタイミングが釣果を左右する岡山県のスポット一覧。',
  },
  yamaguchi: {
    displayName: '山口県',
    region: '中国地方',
    description: '日本海・瀬戸内の両方にアクセス可能。透明度が高く初心者にもおすすめの山口県。',
  },
  tokyo: {
    displayName: '東京都',
    region: '関東地方',
    description: '東京湾岸の護岸・橋脚周りがメインポイント。夜釣りシーバスが人気の都市型釣り場。',
  },
}

const KNOWN_PREFECTURES = Object.keys(PREFECTURE_INFO) as (keyof typeof PREFECTURE_INFO)[]

// ─── Static Params ────────────────────────────────────────────

export function generateStaticParams() {
  return KNOWN_PREFECTURES.map((p) => ({ prefecture: p }))
}

// ─── Metadata ────────────────────────────────────────────────

type Props = { params: Promise<{ prefecture: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { prefecture } = await params
  const info = PREFECTURE_INFO[prefecture]
  if (!info) return { title: 'スポットが見つかりません' }
  return {
    title: `${info.displayName}の釣りスポットランキング｜釣り予報AI`,
    description: info.description,
    openGraph: {
      title: `${info.displayName}の今日の釣りスポットランキング`,
      description: info.description,
      url: `https://fishing-app-omega.vercel.app/spots/${prefecture}`,
    },
  }
}

// ─── スコア色・ラベル ─────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return 'var(--c-green-600)'
  if (score >= 50) return 'var(--c-amber-600)'
  return 'var(--c-red-500, #ef4444)'
}

function scoreLabel(score: number): string {
  if (score >= 80) return '絶好調'
  if (score >= 65) return '好調'
  if (score >= 50) return '普通'
  return '低調'
}

// ─── Page ────────────────────────────────────────────────────

export default async function PrefectureSpotPage({ params }: Props) {
  const { prefecture } = await params
  const info = PREFECTURE_INFO[prefecture]
  if (!info) notFound()

  const [scores, tier] = await Promise.all([
    getSpotScoresByPrefecture(prefecture),
    getSubscriptionTier(),
  ])

  const isPlus       = tier === 'plus'
  const freeScores   = scores.slice(0, FREE_SPOT_LIMIT)
  const lockedScores = scores.slice(FREE_SPOT_LIMIT)

  // spot_id → 表示名マップ
  const spotNameMap = Object.fromEntries(
    getAllFishingSpots().map((s) => [s.id, s.name])
  )

  const isFallback = scores[0]?.dataStatus?.source === 'fallback'
  const validDate  = scores[0]?.valid_date ?? '—'

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 56px' }}>

      {/* パンくず */}
      <nav style={{ fontSize: 13, color: 'var(--c-gray-500)', marginBottom: 16 }}>
        <a href="/" style={{ color: 'var(--c-blue-700)' }}>ホーム</a>
        {' › '}
        <a href="/spots" style={{ color: 'var(--c-blue-700)' }}>釣りスポットランキング</a>
        {' › '}
        <span>{info.displayName}</span>
      </nav>

      {/* ヘッダー */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 6 }}>
        🎣 {info.displayName}の今日の釣りスポット
      </h1>
      <p style={{ fontSize: 14, color: 'var(--c-gray-600)', marginBottom: 8, lineHeight: 1.6 }}>
        {info.description}
      </p>

      {/* データソースバッジ */}
      <div style={{ marginBottom: 20 }}>
        {isFallback ? (
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            background: 'var(--c-amber-50, #fffbeb)', color: 'var(--c-amber-700, #b45309)',
            border: '1px solid var(--c-amber-300, #fcd34d)',
            padding: '3px 10px', borderRadius: 20,
          }}>
            📊 参考データ（Supabase未接続）
          </span>
        ) : (
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            background: 'var(--c-green-50, #f0fdf4)', color: 'var(--c-green-700, #15803d)',
            border: '1px solid var(--c-green-300, #86efac)',
            padding: '3px 10px', borderRadius: 20,
          }}>
            ✅ 毎日自動更新データ（{validDate}）
          </span>
        )}
      </div>

      {/* スコアが0件の場合 */}
      {scores.length === 0 && (
        <div style={{
          padding: '32px 16px', textAlign: 'center',
          color: 'var(--c-gray-500)', fontSize: 14,
          background: 'var(--c-gray-50)', borderRadius: 12,
          marginBottom: 20,
        }}>
          {info.displayName}のスポットデータがまだありません。
        </div>
      )}

      {/* 無料枠：上位3件 */}
      {freeScores.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          {freeScores.map((s, i) => (
            <a
              key={s.spot_id}
              href={`/spots/${s.prefecture}/${s.area}/${s.spot_id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                background: 'var(--bg-card, #fff)',
                border: '1px solid var(--c-gray-200)',
                borderRadius: 'var(--r-card, 12px)',
                padding: '16px 16px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: 'var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))',
              }}>
                {/* 順位 */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? '#f5a623' : i === 1 ? '#9b9b9b' : '#a0522d',
                  color: '#fff', fontWeight: 800, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i + 1}
                </div>

                {/* スポット情報 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-blue-950)', marginBottom: 2 }}>
                    📍 {spotNameMap[s.spot_id] ?? s.spot_id}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-gray-500)', marginBottom: 4 }}>
                    {s.area} · {s.target_fish}
                  </div>
                  {s.reasons && s.reasons.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--c-gray-600)', lineHeight: 1.5 }}>
                      {s.reasons[0]}
                    </div>
                  )}
                  {s.best_time_bands && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.best_time_bands.map((t) => (
                        <span key={t} style={{
                          fontSize: 10, fontWeight: 700,
                          background: 'var(--c-blue-50, #eff6ff)',
                          color: 'var(--c-blue-700)',
                          padding: '2px 8px', borderRadius: 12,
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* スコア */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 26, fontWeight: 900,
                    color: scoreColor(s.score), lineHeight: 1,
                  }}>{s.score}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(s.score), marginTop: 2 }}>
                    {scoreLabel(s.score)}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </section>
      )}

      {/* Plus ロック or 全件表示 */}
      {lockedScores.length > 0 && (
        isPlus ? (
          <section style={{ marginBottom: 20 }}>
            {lockedScores.map((s, i) => (
              <a
                key={s.spot_id}
                href={`/spots/${s.prefecture}/${s.area}/${s.spot_id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  background: 'var(--bg-card, #fff)',
                  border: '1px solid var(--c-gray-200)',
                  borderRadius: 'var(--r-card, 12px)',
                  padding: '16px 16px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: 'var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--c-blue-700)',
                    color: '#fff', fontWeight: 800, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {FREE_SPOT_LIMIT + i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-blue-950)', marginBottom: 2 }}>
                      📍 {spotNameMap[s.spot_id] ?? s.spot_id}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--c-gray-500)' }}>
                      {s.area} · {s.target_fish}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor(s.score), lineHeight: 1 }}>
                      {s.score}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(s.score), marginTop: 2 }}>
                      {scoreLabel(s.score)}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </section>
        ) : (
          /* ── Plus ロック UI ── */
          <div style={{
            position: 'relative',
            borderRadius: 'var(--r-card, 12px)',
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            {lockedScores.slice(0, 3).map((_, i) => (
              <div key={i} style={{
                background: 'var(--c-gray-100, #f3f4f6)',
                borderRadius: 12, padding: '16px 16px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 14,
                filter: 'blur(3px)', userSelect: 'none', pointerEvents: 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--c-gray-300)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: '60%', background: 'var(--c-gray-300)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 11, width: '40%', background: 'var(--c-gray-200)', borderRadius: 4 }} />
                </div>
                <div style={{ width: 40, height: 36, background: 'var(--c-gray-300)', borderRadius: 8 }} />
              </div>
            ))}

            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.92) 40%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              padding: '0 20px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 6 }}>
                4位以降はPlusで見られます
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-gray-600)', marginBottom: 16, lineHeight: 1.5 }}>
                {info.displayName}全{scores.length}スポットのランキングをチェック
              </div>
              <a
                href="/subscribe"
                style={{
                  display: 'inline-block',
                  background: 'var(--c-blue-700)',
                  color: '#fff',
                  fontWeight: 700, fontSize: 15,
                  padding: '12px 28px', borderRadius: 10,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(26,79,138,0.3)',
                }}
              >
                Plusで全ランキングを見る →
              </a>
            </div>
          </div>
        )
      )}

      {/* 免責 */}
      <div style={{
        marginTop: 24, padding: '14px 16px',
        background: 'var(--c-gray-50, #f9fafb)',
        borderRadius: 10, fontSize: 12,
        color: 'var(--c-gray-500)', lineHeight: 1.7,
      }}>
        <div>※ スコアは天気・簡易潮回り・季節・スポット特性をもとにした参考情報です。釣果を保証するものではありません。</div>
        <div>※ 立入禁止区域・漁業権・安全管理を必ず確認し、ライフジャケット着用を推奨します。</div>
      </div>

      {/* 全国ランキングへ戻る */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <a href="/spots" style={{
          fontSize: 14, color: 'var(--c-blue-700)',
          fontWeight: 700, textDecoration: 'none',
        }}>
          ← 全国スポットランキングへ
        </a>
      </div>

    </main>
  )
}
      {/* 全国ランキングへ戻る */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <a href="/spots" style={{
          fontSize: 14, color: 'var(--c-blue-700)',
          fontWeight: 700, textDecoration: 'none',
        }}>
          ← 全国スポットランキングへ
        </a>
      </div>

    </main>
  )
}
