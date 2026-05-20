'use client'

export type RegionId = 'nationwide' | 'chugoku' | 'tokyo_23'
/** @deprecated Use RegionId */
export type Region = RegionId

interface Props {
  selected: RegionId
  onChange: (region: RegionId) => void
}

const REGIONS: { value: RegionId; label: string }[] = [
  { value: 'nationwide', label: '全国' },
  { value: 'chugoku', label: '中国地方' },
  { value: 'tokyo_23', label: '東京23区' },
]

export default function RegionSelector({ selected, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
      {REGIONS.map(r => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          style={{
            padding: '12px 24px', borderRadius: 30, fontSize: 16, fontWeight: 600,
            cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: selected === r.value ? '#1a4f8a' : '#eef2f8',
            color: selected === r.value ? '#fff' : '#1a4f8a',
            minHeight: 48,
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
