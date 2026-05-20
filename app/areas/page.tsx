import type { Metadata } from 'next'
import { REGIONS } from '@/types/region'

export const metadata: Metadata = {
  title: '地域から釣り場を探す｜釣り予報AI',
  description: '広島・山口・岡山・東京湾など地域別の釣り場ガイド。釣れる魚種・おすすめスポット・ベストシーズンを紹介。',
  openGraph: {
    title: '地域から釣り場を探す｜釣り予報AI',
    description: '地域別の釣り場ガイド・魚種情報を確認しよう。',
  },
}

const AREA_INFO: Record<string, { fish: string[]; tips: string }> = {
  tokyo_23: {
    fish: ['シーバス', 'クロダイ', 'アジ', 'メバル'],
    tips: '東京湾岸の護岸・橋脚周りがポイント。夜釣りのシーバスが人気。',
  },
  hiroshima: {
    fish: ['チヌ', 'メバル', 'アオリイカ', 'タチウオ'],
    tips: '瀬戸内の穏やかな海が広がる。落とし込み釣りでチヌが狙える。',
  },
  yamaguchi: {
    fish: ['アジ', 'メバル', 'マダイ', 'カサゴ'],
    tips: '日本海・瀬戸内の両方にアクセス可能。離島の釣り場も豊富。',
  },
  okayama: {
    fish: ['チヌ', 'シーバス', 'アジ', 'メバル'],
    tips: '干満の差が大きい瀬戸内。潮のタイミングが釣果を左右する。',
  },
}

const QUICK_CHIPS = [
  { label: '広島', slug: 'hiroshima', active: true },
  { label: '山口', slug: 'yamaguchi', active: true },
  { label: '岡山', slug: 'okayama', active: true },
  { label: '東京湾', slug: 'tokyo_23', active: true },
  { label: '大阪', slug: null, active: false },
  { label: '兵庫', slug: null, active: false },
]

export default function AreasPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 56px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 6 }}>
        🗾 地域から釣り場を探す
      </h1>
      <p style={{ fontSize: 14, color: 'var(--c-gray-600)', marginBottom: 20 }}>
        地域ごとの釣り場情報・狙える魚・攻略ポイントを紹介します。
      </p>

      {/* クイック地域チップ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gray-700)', marginBottom: 10 }}>
          人気エリアから探す
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_CHIPS.map((chip) => (
            chip.active && chip.slug ? (
              <a
                key={chip.label}
                href={`/areas/${chip.slug}`}
                className="region-chip"
                data-cta="hero-search-region"
              >
                {chip.label}
              </a>
            ) : (
              <span key={chip.label} className="region-chip region-chip-disabled">
                {chip.label}
                <span className="badge-coming-soon" style={{ marginLeft: 4, fontSize: '0.6rem', padding: '1px 6px', borderRadius: 99 }}>準備中</span>
              </span>
            )
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {REGIONS.map((region) => {
          const info = AREA_INFO[region.id]
          return (
            <a
              key={region.id}
              href={`/areas/${region.slug}`}
              className="card card-hover"
              style={{ padding: '18px 20px', display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-blue-800)', marginBottom: 8 }}>
                🗺️ {region.displayName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-gray-500)', marginBottom: 10 }}>
                {region.prefecture}
              </div>
              {info && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--c-gray-600)', fontWeight: 600 }}>主な対象魚：</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {info.fish.map(f => (
                        <span key={f} className="badge badge-fish">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-gray-700)', lineHeight: 1.5 }}>
                    {info.tips}
                  </div>
                </>
              )}
              <div style={{ fontSize: 12, color: 'var(--c-blue-700)', fontWeight: 600, marginTop: 12 }}>
                釣り場・スポットを見る →
              </div>
            </a>
          )
        })}
      </div>

      {/* サブスク CTA バナー */}
      <div style={{
        marginTop: 32,
        background: 'linear-gradient(135deg, var(--c-blue-900), var(--c-teal-800))',
        borderRadius: 'var(--r-card)',
        padding: '22px 22px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
          🔔 地域の釣り予報をメールで受け取る
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16 }}>
          無料登録で気になる地域をお気に入りに追加。釣れる日を見逃さない。
        </div>
        <a href="/signup" className="btn-primary" data-cta="region-save">
          ✅ 無料で登録する
        </a>
      </div>
    </main>
  )
}
