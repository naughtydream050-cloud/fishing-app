'use client'
import { useState, useEffect } from 'react'
import type { GearPrice } from '@/lib/dataAccess'
import GearCard from '@/components/GearCard'
import RegionSelector, { type RegionId } from '@/components/RegionSelector'
import PaywallModal from '@/features/paywall/PaywallModal'
import { getPaywallState, incrementViewCount } from '@/features/paywall'

interface Props {
  initialGear: GearPrice[]
  allRegionGear: Record<string, GearPrice[]>
}

export default function GearList({ initialGear, allRegionGear }: Props) {
  const [region, setRegion] = useState<RegionId>('nationwide')
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    const state = getPaywallState()
    if (state.isBlocked) setShowPaywall(true)
  }, [])

  function handleRegionChange(r: RegionId) {
    const state = incrementViewCount()
    if (state.isBlocked) {
      setShowPaywall(true)
      return
    }
    setRegion(r)
  }

  const gear = allRegionGear[region] ?? initialGear

  return (
    <>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      <RegionSelector selected={region} onChange={handleRegionChange} />
      <div style={{ display: 'grid', gap: 20 }}>
        {gear.map((item, i) => (
          <GearCard key={item.id} item={item} rank={i + 1} />
        ))}
      </div>
    </>
  )
}
