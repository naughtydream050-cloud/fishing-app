'use client'
import { PAYWALL_CONFIG } from '@/features/paywall'

interface Props {
  onClose: () => void
}

export default function PaywallModal({ onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480,
        width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎣</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>
          ここから先は会員限定
        </h2>
        <p style={{ fontSize: 18, color: '#555', marginBottom: 8, lineHeight: 1.6 }}>
          1日{PAYWALL_CONFIG.freeViewLimit}回を超えると会員専用コンテンツになります。
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#1a4f8a', marginBottom: 24 }}>
          月額 <span style={{ fontSize: 32 }}>¥{PAYWALL_CONFIG.monthlyPrice.toLocaleString()}</span>（税込）
        </p>
        <ul style={{ textAlign: 'left', marginBottom: 28, paddingLeft: 20, fontSize: 17, lineHeight: 2, color: '#333' }}>
          <li>最安値情報が無制限で閲覧可能</li>
          <li>価格変動アラート（Phase 2）</li>
          <li>お気に入り釣具の保存（Phase 2）</li>
        </ul>
        <button style={{
          width: '100%', padding: '18px 24px', borderRadius: 10, border: 'none',
          background: '#1a4f8a', color: '#fff', fontSize: 20, fontWeight: 800,
          cursor: 'pointer', marginBottom: 12,
        }}>
          ¥{PAYWALL_CONFIG.monthlyPrice}/月で会員になる（準備中）
        </button>
        <button onClick={onClose} style={{
          width: '100%', padding: '14px 24px', borderRadius: 10, border: '1px solid #ccc',
          background: '#fff', color: '#888', fontSize: 16, cursor: 'pointer',
        }}>
          今は無料で続ける（残り0回）
        </button>
      </div>
    </div>
  )
}
