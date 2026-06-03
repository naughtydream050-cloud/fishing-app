/**
 * POST /api/stripe/create-checkout-session
 *
 * Stripe Checkout session creation.
 * - Supabase Auth session required (401 if not logged in)
 * - metadata.supabase_user_id is passed to link user in webhook
 * - test mode only; never use production keys
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/supabaseServer'

export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login?next=/subscribe', _req.url), 303)
    }

    // 2. Validate env
    const priceId = process.env.STRIPE_PLUS_PRICE_ID
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fishing-app-omega.vercel.app'

    if (!priceId) {
      console.error('[stripe] STRIPE_PLUS_PRICE_ID is not configured')
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 500 },
      )
    }

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode:        'subscription',
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/subscribe/cancel`,
      client_reference_id: user.id,
      // Pass user ID in metadata so webhook can link Stripe customer -> Supabase user
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      // Pre-fill email if available
      ...(user.email ? { customer_email: user.email } : {}),
    })

    if (!session.url) {
      console.error('[stripe] checkout session url is null')
      return NextResponse.json({ error: 'Failed to generate checkout URL' }, { status: 500 })
    }

    // Redirect to Stripe Checkout
    return NextResponse.redirect(session.url)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // Never log secret values
    console.error('[stripe] create-checkout-session error:', message)
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 })
  }
}
