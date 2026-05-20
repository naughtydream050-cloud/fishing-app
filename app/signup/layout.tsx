import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '無料登録｜釣り予報AI',
  description: 'メールアドレスで無料登録。気になる地域・魚種を設定して、釣れる日の情報を受け取ろう。',
  openGraph: {
    title: '無料登録｜釣り予報AI',
    description: '30秒で登録完了。クレジットカード不要。',
    url: 'https://fishing-app-omega.vercel.app/signup',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
