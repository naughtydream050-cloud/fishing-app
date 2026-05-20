import { REGIONS } from '@/types/region'

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

export default function AreasPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 48px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
        🗾 地域別釣り情報
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        地域ごとの釣り場情報・狙える魚・攻略ポイントを紹介します。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {REGIONS.map((region) => {
          const info = AREA_INFO[region.id]
          return (
            <a
              key={region.id}
              href={`/region/${region.slug}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '18px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1a4f8a', marginBottom: 8 }}>
                🗺️ {region.displayName}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                {region.prefecture}
              </div>
              {info && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>主な対象魚：</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {info.fish.map(f => (
                        <span key={f} style={{
                          background: '#eef2f8', color: '#1a4f8a',
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                        }}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                    {info.tips}
                  </div>
                </>
              )}
              <div style={{ fontSize: 12, color: '#1a4f8a', fontWeight: 600, marginTop: 12 }}>
                釣り予報を見る →
              </div>
            </a>
          )
        })}
      </div>
    </main>
  )
}
