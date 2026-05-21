'use client'
import { useState } from 'react'
import { REGIONS } from '@/types/region'
import { FISH_SPECIES } from '@/types/fish'

type FormState = {
  email: string
  region: string
  fish: string[]
}

export default function SignupPage() {
  const [form, setForm] = useState<FormState>({ email: '', region: '', fish: [] })
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function toggleFish(id: string) {
    setForm(prev => ({
      ...prev,
      fish: prev.fish.includes(id) ? prev.fish.filter(f => f !== id) : [...prev.fish, id],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('有効なメールアドレスを入力してください。')
      return
    }
    setError('')
    console.log('[signup] form submitted:', form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main style={{ maxWidth: 520, margin: '48px auto', padding: '0 16px 56px', textAlign: 'center' }}>
        <div className="form-success">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-blue-900)', marginBottom: 10 }}>
            登録受付しました！
          </h1>
          <p style={{ fontSize: 14, color: 'var(--c-gray-600)', lineHeight: 1.7, marginBottom: 24 }}>
            {form.email} に確認メールをお送りします。<br />
            釣り予報の準備ができたらご連絡します。
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/" className="btn-primary" style={{ background: 'var(--c-blue-800)', color: '#fff' }}>
              🏠 トップページへ
            </a>
            <a href="/areas" className="btn-ghost" style={{ color: 'var(--c-blue-800)', borderColor: 'var(--c-blue-300)' }}>
              🗾 地域を探す
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 56px' }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--c-green-100)',
          color: 'var(--c-green-600)',
          fontSize: 12,
          fontWeight: 700,
          padding: '4px 14px',
          borderRadius: 99,
          marginBottom: 12,
        }}>
          ✅ 無料 · 30秒で完了
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-blue-950)', marginBottom: 8 }}>
          無料で釣り情報を受け取る
        </h1>
        <p style={{ fontSize: 13, color: 'var(--c-gray-600)', lineHeight: 1.6 }}>
          地域と魚種を設定して、釣れる日を見逃さない。
        </p>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="signup-form">

        {/* メールアドレス */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--c-gray-700)', marginBottom: 6 }}>
            メールアドレス <span style={{ color: 'var(--c-red-600)' }}>*</span>
          </label>
          <input
            type="email"
            required
            placeholder="example@email.com"
            value={form.email}
            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: `1.5px solid ${error ? 'var(--c-red-600)' : 'var(--c-gray-200)'}`,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#fff',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: 'var(--c-red-600)', marginTop: 4 }}>{error}</div>
          )}
        </div>

        {/* よく行く地域 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--c-gray-700)', marginBottom: 6 }}>
            よく行く地域
          </label>
          <select
            value={form.region}
            onChange={e => setForm(prev => ({ ...prev, region: e.target.value }))}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid var(--c-gray-200)',
              fontSize: 14,
              outline: 'none',
              background: '#fff',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <option value="">選択してください（任意）</option>
            {REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.displayName}（{r.prefecture}）</option>
            ))}
          </select>
        </div>

        {/* 狙いたい魚 */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--c-gray-700)', marginBottom: 8 }}>
            狙いたい魚（複数選択可）
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FISH_SPECIES.map(f => {
              const checked = form.fish.includes(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFish(f.id)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 99,
                    border: `2px solid ${checked ? 'var(--c-blue-700)' : 'var(--c-gray-200)'}`,
                    background: checked ? 'var(--c-blue-50)' : '#fff',
                    color: checked ? 'var(--c-blue-800)' : 'var(--c-gray-600)',
                    fontSize: 13,
                    fontWeight: checked ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {checked ? '✓ ' : ''}{f.displayName}
                </button>
              )
            })}
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          className="btn-nav-accent"
          style={{ width: '100%', fontSize: '0.95rem', padding: '13px 20px', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
        >
          ✅ 無料で登録する
        </button>

        <p style={{ fontSize: 11, color: 'var(--c-gray-400)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          登録することで利用規約・プライバシーポリシーに同意したものとみなされます。
        </p>
      </form>

    </main>
  )
}
