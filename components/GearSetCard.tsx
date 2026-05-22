import type { GearSet, GearCategory, PriceTier } from '@/lib/gearRecommendation'

interface GearSetCardProps {
  gearSet: GearSet
  showDataSource?: boolean
}

const CATEGORY_LABELS: Record<GearCategory, string> = {
  rod:     'ロッド',
  reel:    'リール',
  lure:    'ルアー',
  worm:    'ワーム',
  jighead: 'ジグヘッド',
  line:    'ライン',
  hook:    'フック',
  rig:     '仕掛け',
  safety:  '安全装備',
  cooler:  'クーラー',
  storage: '収納',
  light:   'ライト',
  tool:    'ツール',
  wear:    'ウェア',
  unknown: 'その他',
}

const TIER_LABELS: Record<PriceTier, string> = {
  budget:  '入門価格帯',
  mid:     'スタンダード',
  premium: 'ハイエンド',
}

const CATEGORY_CHIP_COLORS: Partial<Record<GearCategory, { bg: string; text: string }>> = {
  rod:     { bg: 'var(--c-blue-700)',   text: '#fff' },
  reel:    { bg: 'var(--c-blue-700)',   text: '#fff' },
  lure:    { bg: 'var(--c-green-600)',  text: '#fff' },
  worm:    { bg: 'var(--c-green-600)',  text: '#fff' },
  jighead: { bg: 'var(--c-green-600)',  text: '#fff' },
  rig:     { bg: 'var(--c-green-600)',  text: '#fff' },
  safety:  { bg: 'var(--c-red-600)',    text: '#fff' },
  line:    { bg: 'var(--c-amber-600)',  text: '#fff' },
  hook:    { bg: 'var(--c-amber-600)',  text: '#fff' },
}

function getCategoryChipStyle(category: GearCategory): React.CSSProperties {
  const colors = CATEGORY_CHIP_COLORS[category] ?? { bg: '#6b7280', text: '#fff' }
  return {
    background: colors.bg,
    color: colors.text,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    display: 'inline-block',
  }
}

function getTierChipStyle(): React.CSSProperties {
  return {
    background: 'var(--c-blue-50)',
    color: 'var(--c-blue-800)',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
    display: 'inline-block',
    border: '1px solid var(--c-blue-200, #bfdbfe)',
  }
}

export default function GearSetCard({ gearSet, showDataSource = true }: GearSetCardProps) {
  const primaryItems = gearSet.items.filter(i => i.isPrimaryItem)
  const supplementaryItems = gearSet.items.filter(i => !i.isPrimaryItem)

  return (
    <div className="card" style={{ padding: '20px 20px', borderRadius: 'var(--r-card)' }}>

      {/* ヘッダー */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-blue-950)', marginBottom: 4 }}>
          🛒 {gearSet.title}
        </div>
        {gearSet.totalEstimatedCost > 0 && (
          <div style={{ fontSize: 13, color: 'var(--c-gray-500)' }}>
            推定コスト目安: ¥{gearSet.totalEstimatedCost.toLocaleString()}〜
          </div>
        )}
      </div>

      {/* データソース注記 */}
      {showDataSource && (
        <div style={{ fontSize: 11, color: 'var(--c-gray-500)', marginBottom: 16, marginTop: 6 }}>
          {gearSet.dataSource === 'mock'
            ? '※ 参考データ（実際の価格はリンク先でご確認ください）'
            : '価格は楽天・Yahoo!の最安値を表示'}
        </div>
      )}

      {/* メインアイテム */}
      {primaryItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          {primaryItems.map((scored) => (
            <div
              key={scored.item.id}
              style={{
                border: '1px solid var(--c-gray-200, #e5e7eb)',
                borderRadius: 10,
                padding: '14px 14px',
              }}
            >
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={getCategoryChipStyle(scored.category)}>
                  {CATEGORY_LABELS[scored.category]}
                </span>
                <span style={getTierChipStyle()}>
                  {TIER_LABELS[scored.priceTier]}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {scored.item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={scored.item.image}
                    alt={scored.item.title}
                    style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0, borderRadius: 6 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--c-blue-900)',
                    marginBottom: 4,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {scored.item.title}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-red-600)', marginBottom: 4 }}>
                    ¥{scored.item.price.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-gray-500)', marginBottom: 10, lineHeight: 1.5 }}>
                    {scored.reason}
                  </div>
                  {scored.item.affiliateUrl && scored.item.affiliateUrl !== '#' ? (
                    <a
                      href={scored.item.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: 'var(--c-blue-700)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '6px 14px',
                        borderRadius: 6,
                        textDecoration: 'none',
                      }}
                    >
                      最安値で見る →
                    </a>
                  ) : (
                    <span style={{
                      display: 'inline-block',
                      background: 'var(--c-gray-200, #e5e7eb)',
                      color: 'var(--c-gray-500)',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 6,
                    }}>
                      参考商品
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 補足アイテム */}
      {supplementaryItems.length > 0 && (
        <div style={{ borderTop: '1px solid var(--c-gray-200, #e5e7eb)', paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-gray-500)', marginBottom: 8 }}>
            補足アイテム
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {supplementaryItems.map((scored) => (
              <div key={scored.item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={getCategoryChipStyle(scored.category)}>
                  {CATEGORY_LABELS[scored.category]}
                </span>
                <span style={{ fontSize: 13, color: 'var(--c-gray-700)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {scored.item.title}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gray-600)', flexShrink: 0 }}>
                  ¥{scored.item.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フッター免責 */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: 'var(--c-gray-400, #9ca3af)',
        lineHeight: 1.6,
        borderTop: '1px solid var(--c-gray-100, #f3f4f6)',
        paddingTop: 12,
      }}>
        <div>※ 価格は取得時点のものです。実際の価格はリンク先でご確認ください。</div>
        <div>※ 釣具を購入する際はライフジャケット着用を推奨します。</div>
      </div>
    </div>
  )
}
