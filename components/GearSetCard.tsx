import type { GearSet, GearCategory, PriceTier } from '@/lib/gearRecommendation'

interface GearSetCardProps {
  gearSet: GearSet | null
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
  if (!gearSet) return null
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
              <div style={{ display: 'flex', gap: 6, marginBottom: 