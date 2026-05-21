'use client'

import type { DataStatus } from '@/lib/forecastRepository'

type Props = {
  isMock: boolean
  generatedAt?: string
  dataSource?: string
  dataStatus?: DataStatus
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${h}:${min}`
}

function reasonLabel(reason: DataStatus['reason']): string {
  switch (reason) {
    case 'USE_MOCK_DATA=true': return 'USE_MOCK_DATA=true（強制モック）'
    case 'missing-env': return 'Supabase環境変数未設定'
    case 'no-data': return 'DBにデータなし'
    case 'fetch-error': return '接続エラー'
    default: return reason
  }
}

export default function DataSourceBadge({ isMock, generatedAt, dataSource, dataStatus }: Props) {
  const liveMessage = dataStatus?.message ?? (generatedAt ? `実データ更新: ${formatDate(generatedAt)}` : '実データ')
  const demoReason = dataStatus && dataStatus.reason !== 'ok' ? `（${reasonLabel(dataStatus.reason)}）` : ''

  return (
    <div style={{ marginBottom: 12 }}>
      {isMock ? (
        <span className="badge-demo">
          🔸 デモデータ（本番データ未接続）{demoReason}
        </span>
      ) : (
        <span className="badge-live">
          📡 {liveMessage}
          {dataSource && dataSource !== 'supabase' && (
            <span style={{ fontWeight: 400, opacity: 0.75 }}> ({dataSource})</span>
          )}
        </span>
      )}

      <div style={{
        marginTop: 8,
        fontSize: 11,
        color: '#6b7280',
        lineHeight: 1.6,
        borderLeft: '3px solid #e5e7eb',
        paddingLeft: 8,
      }}>
        <div>※ 釣れそう度は天気・簡易潮回り・過去傾向をもとにした参考情報です。釣果を保証するものではありません。</div>
        <div>※ 潮回りは簡易推定です。実際の満潮・干潮時刻は各地の潮位表を確認してください。</div>
        <div>※ 立入禁止区域・漁業権・安全管理を必ず確認し、ライフジャケット着用を推奨します。</div>
      </div>
    </div>
  )
}
