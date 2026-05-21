import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: '釣り予報AI | 今日どこで何が釣れる？釣果・釣具最安値',
  description: '地域別の釣果情報、今週の釣り予想、釣具セールを毎日更新。気象庁データ×AIで全国の釣り場を徹底分析。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
