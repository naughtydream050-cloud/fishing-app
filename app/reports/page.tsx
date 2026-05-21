import { MOCK_FISHING_REPORTS } from '@/lib/mockFishingReports'

export default function ReportsPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 48px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
        🐟 最近の釣果報告
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        全国各地からの最新釣果情報をお届けします。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MOCK_FISHING_REPORTS.map((report) => (
          <a
            key={report.id}
            href={`/reports/${report.id}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {report.imageUrl && (
              <div style={{
                height: 140,
                backgroundImage: `url(${report.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 10,
                marginBottom: 14,
              }} />
            )}
            <div style={{ fontSize: 12, color: '#1a4f8a', fontWeight: 600, marginBottom: 6 }}>
              📍 {report.area} ｜ {report.fishName.join('・')}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 8 }}>
              {report.title}
            </div>
            <div style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 10 }}>
              {report.summary}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {report.sourceName} · {report.publishedAt}
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
