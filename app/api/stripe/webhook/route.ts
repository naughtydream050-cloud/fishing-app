/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook エンドポイント。署名検証あり。
 * 購読状態変化をここで受け取り、Supabase user_subscriptions を更新する（TODO）。
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

// Next.js App Router では body を raw で読む必要がある
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe/webhook] Signature verification failed:', message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // イベント処理
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      // TODO: Supabase user_subscriptions を upsert
      // await upsertSubscription({
      //   stripeSubscriptionId: subscription.id,
      //   stripeCustomerId:     subscription.customer as string,
      //   status:               subscription.status,
      //   currentPeriodEnd:     new Date(subscription.current_period_end * 1000),
      // })
      console.log('[stripe/webhook] subscription upsert needed for:', subscription.id)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // TODO: Supabase user_subscriptions の status を 'canceled' に更新
      // await cancelSubscription(subscription.id)
      console.log('[stripe/webhook] subscription cancel needed for:', subscription.id)
      break
    }
    default:
      // 未処理イベントは無視
      break
  }

  return NextResponse.json({ received: true })
}
