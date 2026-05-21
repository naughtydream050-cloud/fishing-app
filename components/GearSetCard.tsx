import type { GearSet } from '@/lib/gearRecommendation'

interface Props {
  gearSet: GearSet | null
}

export default function GearSetCard({ gearSet }: Props) {
  if (!gearSet) {
    return (
      <p style={{ color: '#9ca3af', fontSize: 14, padding: '8px 0' }}>
        商品データを準備中です
      </p>
    )
  }

  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #dde6f0', borderRadius: 14,
      padding: 24, marginTop: 24,
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a4f8a', marginBottom: 4 }}>
        🎣 {gearSet.title}
      </h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
        {gearSet.reason}
      </p>

      {gearSet.isMock && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, color: '#92400e', marginBottom: 16,
          fontWeight: 600,
        }}>
          これはデモ商品セットです
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {gearSet.items.map((item) => {
          const isDemo = item.product.affiliateUrl.includes('example')
          const href = isDemo ? '#' : item.product.affiliateUrl
          const platformLabel = item.product.platform === 'rakuten' ? '楽天市場' : 'Yahoo!ショッピング'

          return (
            <div
              key={item.product.id}
              style={{
                background: '#fff', borderRadius: 10, padding: 16,
                border: item.isPrimary ? '2px solid #1a4f8a' : '1px solid #e2e8f0',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}
            >
              {item.product.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.product.image}
                  alt={item.product.title}
                  width={72}
                  height={72}
                  style={{ objectFit: 'contain', borderRadius: 8, border: '1px solid #eee', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  {item.isPrimary && (
                    <span style={{
                      fontSize: 11, background: '#1a4f8a', color: '#fff',
                      borderRadius: 20, padding: '2px 8px', fontWeight: 700,
                    }}>
                      必須
                    </span>
                  )}
                  <span style={{
                    fontSize: 11, background: '#e8f4f8', color: '#1a4f8a',
                    borderRadius: 20, padding: '2px 8px',
                  }}>
                    {platformLabel}
                  </span>
                  {isDemo && (
                    <span style={{
                      fontSize: 11, background: '#f3f4f6', color: '#9ca3af',
                      borderRadius: 20, padding: '2px 8px',
                    }}>
                      デモ商品
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 4 }}>
                  {item.product.title}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1a4f8a', marginBottom: 10 }}>
                  ¥{item.product.price.toLocaleString()}
                </div>
                <a
                  href={href}
                  target={isDemo ? undefined : '_blank'}
                  rel={isDemo ? undefined : 'noopener noreferrer'}
                  style={{
                    display: 'inline-block', fontSize: 13, fontWeight: 600,
                    padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
                    background: isDemo ? '#e5e7eb' : '#1a4f8a',
                    color: isDemo ? '#9ca3af' : '#fff',
                    pointerEvents: isDemo ? 'none' : 'auto',
                  }}
                >
                  {isDemo ? 'デモ商品' : '商品を見る →'}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{
        fontSize: 12, color: '#9ca3af', marginTop: 20,
        borderTop: '1px solid #e2e8f0', paddingTop: 12,
      }}>
        商品情報は参考です。実際の釣果を保証するものではありません。
      </p>
    </div>
  )
}
