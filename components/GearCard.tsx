import type { GearPrice } from '@/lib/dataAccess'

interface Props {
  item: GearPrice
  rank: number
}

export default function GearCard({ item, rank }: Props) {
  const rakutenPrice = item.platform === 'rakuten' ? item.price : item.competitorPrice
  const yahooPrice = item.platform === 'yahoo' ? item.price : item.competitorPrice
  const cheaperPlatform = (rakutenPrice ?? Infinity) <= (yahooPrice ?? Infinity) ? 'rakuten' : 'yahoo'

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 20,
      border: '1px solid #dde', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          background: '#1a4f8a', color: '#fff', borderRadius: 8,
          width: 36, height: 36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0,
        }}>
          {rank}
        </div>
        {item.image && (
          <img src={item.image} alt={item.title}
            width={90} height={90}
            style={{ objectFit: 'contain', borderRadius: 8, border: '1px solid #eee', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          {item.manufacturer && (
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{item.manufacturer}</div>
          )}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4 }}>
            {item.title}
          </div>
        </div>
      </div>

      {/* Price Comparison */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Rakuten */}
        <div style={{
          flex: 1, minWidth: 140, padding: '12px 16px', borderRadius: 10,
          background: cheaperPlatform === 'rakuten' ? '#fff3f3' : '#f8f8f8',
          border: cheaperPlatform === 'rakuten' ? '2px solid #e44' : '1px solid #ddd',
          position: 'relative',
        }}>
          {cheaperPlatform === 'rakuten' && (
            <span style={{
              position: 'absolute', top: -12, left: 12,
              background: '#e44', color: '#fff', fontSize: 12, fontWeight: 700,
              padding: '2px 10px', borderRadius: 20,
            }}>最安値</span>
          )}
          <div style={{ fontSize: 13, color: '#e44', fontWeight: 600, marginBottom: 4 }}>楽天市場</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>
            {rakutenPrice ? `¥${rakutenPrice.toLocaleString()}` : '—'}
          </div>
        </div>

        {/* Yahoo */}
        <div style={{
          flex: 1, minWidth: 140, padding: '12px 16px', borderRadius: 10,
          background: cheaperPlatform === 'yahoo' ? '#fff8f0' : '#f8f8f8',
          border: cheaperPlatform === 'yahoo' ? '2px solid #f50' : '1px solid #ddd',
          position: 'relative',
        }}>
          {cheaperPlatform === 'yahoo' && (
            <span style={{
              position: 'absolute', top: -12, left: 12,
              background: '#f50', color: '#fff', fontSize: 12, fontWeight: 700,
              padding: '2px 10px', borderRadius: 20,
            }}>最安値</span>
          )}
          <div style={{ fontSize: 13, color: '#f50', fontWeight: 600, marginBottom: 4 }}>Yahoo!</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>
            {yahooPrice ? `¥${yahooPrice.toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <a
        href={item.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block', textAlign: 'center',
          background: '#1a4f8a', color: '#fff',
          padding: '16px 24px', borderRadius: 10,
          fontSize: 18, fontWeight: 700, textDecoration: 'none',
          letterSpacing: 0.5,
        }}
      >
        最安値で見る →
      </a>
    </div>
  )
}
