/**
 * lib/stripe.ts
 *
 * Stripe SDK の初期化。test mode 専用。
 * STRIPE_SECRET_KEY は環境変数から取得。
 * keyをログに出力しない。
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  // ビルド時はスキップ（Vercel の preview/production で env が未設定の場合）
  if (process.env.NODE_ENV === 'production') {
    console.error('[stripe] STRIPE_SECRET_KEY is not set. Stripe features will be unavailable.')
  }
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
})
