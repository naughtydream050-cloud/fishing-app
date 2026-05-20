'use client'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/', label: '🏠 ホーム' },
  { href: '/forecast', label: '📅 予報' },
  { href: '/reports', label: '🐟 釣果' },
  { href: '/areas', label: '🗾 地域' },
  { href: '/articles', label: '📰 記事' },
  { href: '/deals', label: '🛒 釣具' },
  { href: '/subscribe', label: '⭐ プレミアム' },
]

const NAV_LINKS_MOBILE = [
  { href: '/', label: '🏠 ホーム' },
  { href: '/forecast', label: '📅 今週の釣り予想' },
  { href: '/reports', label: '🐟 釣果報告' },
  { href: '/areas', label: '🗾 地域から探す' },
  { href: '/articles', label: '📰 全国特集・記事' },
  { href: '/deals', label: '🛒 激安釣具' },
  { href: '/subscribe', label: '⭐ プレミアムとは' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="header-root">
      <div className="header-inner">
        {/* Logo */}
        <a href="/" className="header-logo">
          <span className="header-logo-main">🎣 釣り予報AI</span>
          <span className="header-logo-sub">全国の釣り情報を毎日更新</span>
        </a>

        {/* Desktop nav */}
        <nav className="header-nav" aria-label="グローバルナビ">
          {NAV_LINKS.slice(1).map(link => (
            <a key={link.href} href={link.href} className="header-nav-link">
              {link.label}
            </a>
          ))}
          <a
            href="/signup"
            className="btn-nav-accent"
            data-cta="nav-free-signup"
            style={{ marginLeft: 4 }}
          >
            無料登録
          </a>
        </nav>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={open}
          className="header-hamburger"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="header-mobile-menu" aria-label="モバイルナビ">
          {NAV_LINKS_MOBILE.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="header-mobile-link"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/signup"
            onClick={() => setOpen(false)}
            className="header-mobile-link"
            data-cta="nav-free-signup"
            style={{
              background: 'var(--c-green-600)',
              color: '#fff',
              fontWeight: 800,
              borderRadius: 10,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            ✅ 無料登録（30秒）
          </a>
        </nav>
      )}
    </header>
  )
}
