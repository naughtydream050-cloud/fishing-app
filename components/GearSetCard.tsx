import type { GearSet } from '@/lib/gearRecommendation'

const SOURCE_LABEL: Record<string, string> = {
  mock:   'デモデータ',
  api:    'リアルタイム',
  manual: '編集部データ',
}

function isDummyUrl(url: string): boolean {
  return !url || url.includes('example.rakuten.co.jp') || url.includes('example.com')
}

export default function GearSetCard({ gearSet }: { gearSet: GearSet | null }) {
  if (!gearSet) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-center text-gray-500 text-sm">
        商品データを準備中です
      </div>
    )
  }

  const primary      = gearSet.items.filter(i => i.isPrimary)
  const supplementary = gearSet.items.filter(i => !i.isPrimary)

  return (
    <div className="rounded-xl border border-blue-100 bg-white shadow-sm p-5 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-800 text-base leading-snug">{gearSet.title}</h3>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {SOURCE_LABEL[gearSet.dataSource] ?? gearSet.dataSource}
        </span>
      </div>

      {/* デモバナー */}
      {gearSet.isMock && (
        <p className="text-xs bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-yellow-800">
          これは参考セットです。実際の商品リンクは準備中です。
        </p>
      )}

      {/* 基本装備 */}
      {primary.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">基本装備</p>
          {primary.map((item, i) => {
            const dummy = isDummyUrl(item.gear.affiliateUrl)
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium shrink-0">
                  {item.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.gear.title}
                    {dummy && <span className="ml-1 text-xs text-gray-400">[デモ]</span>}
                  </p>
                  <p className="text-xs text-gray-500">{item.reason}</p>
                </div>
                {dummy ? (
                  <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">参考</span>
                ) : (
                  <a
                    href={item.gear.affiliateUrl}
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

      {/* 補助アイテム */}
      {supplementary.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">あると便利</p>
          <div className="flex flex-wrap gap-2">
            {supplementary.map((item, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {item.gear.title.slice(0, 15)}{item.gear.title.length > 15 ? '…' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 免責 */}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        商品情報は参考です。実際の釣果を保証するものではありません。
      </p>
    </div>
  )
}
