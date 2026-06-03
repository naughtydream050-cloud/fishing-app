import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabaseServer'

type Props = {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>
}

export const metadata: Metadata = {
  title: 'ログイン | 釣り予報AI',
  description: '釣り予報AI Plusにログインします。',
}

function safeNext(next?: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/spots'
  return next
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const next = safeNext(params.next)
  const user = await getCurrentUser()
  if (user) redirect(next)

  async function sendMagicLink(formData: FormData) {
    'use server'

    const email = String(formData.get('email') ?? '').trim()
    const redirectTo = safeNext(String(formData.get('next') ?? '/spots'))

    if (!email || !email.includes('@')) {
      redirect(`/login?next=${encodeURIComponent(redirectTo)}&error=invalid_email`)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fishing-app-omega.vercel.app'
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      redirect(`/login?next=${encodeURIComponent(redirectTo)}&error=send_failed`)
    }

    redirect(`/login?next=${encodeURIComponent(redirectTo)}&sent=1`)
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px 56px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--c-blue-950)', marginBottom: 8 }}>
        ログイン
      </h1>
      <p style={{ fontSize: 14, color: 'var(--c-gray-600)', lineHeight: 1.7, marginBottom: 24 }}>
        メールアドレスにログインリンクを送ります。Plus決済と有料ページの解放にはログインが必要です。
      </p>

      {params.sent && (
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--c-green-50, #f0fdf4)', color: 'var(--c-green-700, #15803d)', marginBottom: 18, fontSize: 14 }}>
          ログインリンクを送信しました。メール内のリンクを開いて続行してください。
        </div>
      )}

      {params.error && (
        <div style={{ padding: 14, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', marginBottom: 18, fontSize: 14 }}>
          メール送信に失敗しました。アドレスと環境設定を確認してください。
        </div>
      )}

      <form action={sendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="next" value={next} />
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gray-700)' }}>
          メールアドレス
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="example@email.com"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1.5px solid var(--c-gray-200)',
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          style={{
            minHeight: 44,
            border: 'none',
            borderRadius: 10,
            background: 'var(--c-blue-700, #1d4ed8)',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ログインリンクを送る
        </button>
      </form>
    </main>
  )
}
