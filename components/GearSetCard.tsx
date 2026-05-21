import type { GearSet } from '@/lib/gearRecommendation'

const DATA_SOURCE_LABEL: Record<string, string> = {
  manual: '編集部データ',
  mock: 'デモデータ',
  api: 'リアルタイム',
  generated: 'AI生成',
}

function isExampleUrl(url?: string): boolean {
  if (!url) return true
  return url.includes('example.rakuten.co.jp') || url.includes('example.com')
}

export default function GearSetCard({ gearSet }: { gearSet: GearSet | null }) {
  if (!gearSet) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-center text-gray-500 text-sm">
        商品データを準備中です
      </div>
    )
  }

  const primaryItems = gearSet.items.filter(i => i.isPrimary)
  const supplementaryItems = gearSet.items.filter(i => !i.isPrimary)
  const allMock = gearSet.isMock

  return (
    <div className="rounded-xl border border-blue-100 bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-800 text-base leading-snug">{gearSet.title}</h3>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {DATA_SOURCE_LABEL[gearSet.dataSource] ?? gearSet.dataSource}
        </span>
      </div>

      {allMock && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-xs text-yellow-800">
          これはデモ商品セットです。実際の商品情報ではありません。
        </div>
      )}

      {primaryItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">基本装備</p>
          {primaryItems.map((item, i) => {
            const isDummy = isExampleUrl(item.product.affiliateUrl)
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                  {item.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.product.title}
                    {item.product.isMock && (
                      <span className="ml-1 text-xs text-gray-400">[デモ商品]</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{item.reason}</p>
                </div>
                {isDummy ? (
                  <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    参考
                  </span>
                ) : (
                  <a
                    href={item.product.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
                  >
                    詳細
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {supplementaryItems.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">あると便利</p>
          <div className="flex flex-wrap gap-2">
            {supplementaryItems.map((item, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {item.product.title}
                {item.product.isMock && ' [デモ]'}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        商品情報は参考です。実際の釣果を保証するものではありません。
      </p>
    </div>
  )
}
