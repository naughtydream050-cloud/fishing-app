import type { Metadata } from 'next'
import { getLatestSpotScores } from '@/lib/spotScoreRepository'
import { getSubscriptionTier, FREE_SPOT_LIMIT } from '@/lib/subscription'
import { getAllFishingSpots } from '@/data/spots'

export const revalidate = 0  // SSR — 常に最新スコアを表示

export const metadata: Metadata = {
  title: '今日の釣りスポットランキング｜釣り予報AI',
  description: '天気・潮・季節を組み合わせて全国の釣りスポットを毎日自動評価。今日釣れそうなスポットをスコア順に表示します。',
  openGraph: {
    title: '今日の釣りスポットランキング｜釣り予報AI',
    description: '毎日自動更新。今日どのスポットで釣れそう？全国スポットをスコアで比較。',
    url: 'https://fishing-app-omega.vercel.app/spots',
  },
}

// スコアに応じた色
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

export default async function SpotsPage() {
  const [scores, tier] = await Promise.all([
    getLatestSpotScores(),
    getSubscriptionTier(),
  ])

  const isPlus       = tier === 'plus'
  const freeScores   = scores.slice(0, FREE_SPOT_LIMIT)
  const lockedScores = scores.slice(FREE_SPOT_LIMIT)

  // spot_id → 表示名マップ（data/spots.ts から）
  const spotNameMap = Object.fromEntries(
    getAllFishingSpots().map((s) => [s.id, s.name])
  )

  // fallback かどうかを最初のレコードから判定
  const isFallback = scores[0]?.dataStatus?.source === 'fallback'
  const validDate  = scores[0]?.valid_date ?? '—'

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 56px' }}>

      {/* パンくず */}
      <nav style={{ fontSize: 13, color: 'var(--c-gray-500)', marginBottom: 16 }}>
        <a href="/" style={{ color: 'var(--c-blue-700)' }}>ホーム</a>
        {' › '}
        <span>釣りスポットランキング</span>
      </nav>

      {/* ヘッダー */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 6 }}>
        🎣 今日の釣りスポットランキング
      </h1>
      <p style={{ fontSize: 14, color: 'var(--c-gray-600)', marginBottom: 8, lineHeight: 1.6 }}>
        天気・潮回り・季節を組み合わせて毎日自動評価。スコアが高いほど釣れやすいコンディションです。
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

      {/* 無料枠：上位3件 */}
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
              padding: '16px 16px',
              marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: 'var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))',
              transition: 'box-shadow 0.15s',
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
                  {s.prefecture} · {s.area} · {s.target_fish}
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
                  color: scoreColor(s.score),
                  lineHeight: 1,
                }}>{s.score}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(s.score), marginTop: 2 }}>
                  {scoreLabel(s.score)}
                </div>
              </div>
            </div>
          </a>
        ))}
      </section>

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
                      {s.prefecture} · {s.area} · {s.target_fish}
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
            {/* ぼかしプレビュー（4〜6位のシルエット） */}
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

            {/* ロックオーバーレイ */}
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
                全{scores.length}スポットのランキング・魚種別・時間帯別スコアをチェック
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
        <div>※ 潮回りは月齢ベースの簡易推定です。実際の満潮・干潮時刻は各地の潮位表を確認してください。</div>
        <div>※ 立入禁止区域・漁業権・安全管理を必ず確認し、ライフジャケット着用を推奨します。</div>
      </div>

      {/* 都道府県リンク */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-900)', marginBottom: 12 }}>
          都道府県から探す
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['hiroshima', 'okayama', 'yamaguchi', 'tokyo'] as const).map((pref) => (
            <a
              key={pref}
              href={`/spots/${pref}`}
              style={{
                padding: '7px 14px', borderRadius: 20,
                background: 'var(--c-blue-50, #eff6ff)',
                color: 'var(--c-blue-700)',
                fontSize: 13, fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid var(--c-blue-200, #bfdbfe)',
              }}
            >
              {pref === 'hiroshima' ? '広島' : pref === 'okayama' ? '岡山' : pref === 'yamaguchi' ? '山口' : '東京'}
            </a>
          ))}
        </div>
      </section>

    </main>
  )
}
