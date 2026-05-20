'use client'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/', label: '🏠 ホーム' },
  { href: '/forecast', label: '📅 今週の釣り予想' },
  { href: '/reports', label: '🐟 先週の釣果報告' },
  { href: '/deals', label: '🛒 激安釣具' },
  { href: '/articles', label: '📰 全国特集' },
  { href: '/areas', label: '🗾 地域別情報' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      background: '#1a4f8a',
      color: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
      }}>
        {/* Logo */}
        <a
          href="/"
          style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          🎣 釣り予報AI
        </a>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 0 }} aria-label="グローバルナビ">
          {NAV_LINKS.slice(1).map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                color: 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                fontSize: 13,
                padding: '0 10px',
                lineHeight: '52px',
                display: 'none', // hidden on mobile, shown via CSS below
              }}
              className="desktop-nav-link"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Hamburger button */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="メニューを開く"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 24,
            cursor: 'pointer',
            padding: '4px 8px',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <nav
          style={{
            background: '#163d6e',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
          aria-label="モバイルナビ"
        >
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                color: '#fff',
                textDecoration: 'none',
                padding: '14px 20px',
                fontSize: 16,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
