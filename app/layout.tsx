import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '釣り最安値 | AI釣り用品価格比較',
  description: 'AIが釣り用品の最安値を自動検索。楽天・Yahoo!ショッピングを一括比較。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
