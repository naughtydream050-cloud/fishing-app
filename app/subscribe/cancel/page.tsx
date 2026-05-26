import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '決済キャンセル｜釣り予報AI',
  description: '決済をキャンセルしました。',
}

export default function SubscribeCancelPage() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🔙</div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--c-blue-950)', marginBottom: 12 }}>
        決済をキャンセルしました
      </h1>
      <p style={{ fontSize: 15, color: 'var(--c-gray-600)', lineHeight: 1.7, marginBottom: 32 }}>
        Plusへの登録はキャンセルされました。<br />
        いつでも再度お申し込みいただけます。
      </p>
      <Link
        href="/subscribe"
        style={{
          display: 'inline-block',
          background: 'var(--c-blue-600, #2563eb)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          padding: '14px 32px',
          borderRadius: 8,
          textDecoration: 'none',
        }}
      >
        プランページに戻る
      </Link>
    </main>
  )
}
