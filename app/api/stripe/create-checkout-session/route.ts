/**
 * POST /api/stripe/create-checkout-session
 *
 * Stripe Checkout セッションを作成して URL を返す。
 * test mode 専用。本番キーは使わない。
 */

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const priceId  = process.env.STRIPE_PLUS_PRICE_ID
    const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fishing-app-omega.vercel.app'

    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_PLUS_PRICE_ID is not configured' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/subscribe/cancel`,
      // TODO: Supabase Auth と連携後に customer_email を渡す
      // customer_email: user.email,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // keyはログに含めない
    console.error('[stripe] create-checkout-session error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
