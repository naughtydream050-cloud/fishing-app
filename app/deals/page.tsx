import { getTrendingGears, sortGearWithPrimaryFirst } from '@/lib/dataAccess'
import { isFishingProduct } from '@/lib/productFilter'
import GearCard from '@/components/GearCard'

export const revalidate = 3600

const GEAR_KEYWORDS = ['釣り竿', 'リール', 'ルアー', 'ワーム', 'ライフジャケット', 'クーラーボックス']

export default async function DealsPage() {
  const results = await Promise.allSettled(
    GEAR_KEYWORDS.map(kw =>
      getTrendingGears(kw, 'nationwide').catch(() => [] as Awaited<ReturnType<typeof getTrendingGears>>)
    )
  )

  const seen = new Set<string>()
  const allGear = sortGearWithPrimaryFirst(
    results
      .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
      .filter(isFishingProduct)
      .filter(item => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
  )

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 48px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
        🛒 激安釣具一覧（最安値順）
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        楽天・Yahoo!の最安値をAIが毎日自動比較。ロッド・リール・ルアー・安全装備など{allGear.length}件の釣具を掲載中。
      </p>

      {allGear.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 12, padding: '40px 24px',
          textAlign: 'center', color: '#888', fontSize: 15,
        }}>
          データ取得中です。しばらくお待ちください。
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {allGear.map((item, i) => (
            <GearCard key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      )}
    </main>
  )
}
