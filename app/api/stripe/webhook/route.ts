/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook endpoint with signature verification.
 * Updates Supabase user_subscriptions on subscription events.
 *
 * Events handled:
 *   checkout.session.completed     -> link user_id + initial upsert
 *   customer.subscription.created  -> save status / period_end
 *   customer.subscription.updated  -> update status / period_end
 *   customer.subscription.deleted  -> set status = 'canceled'
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

// Raw body required for Stripe signature verification
export const runtime = 'nodejs'

// ── helpers ──────────────────────────────────────────────────────────────────

async function upsertSubscription(params: {
  userId:               string
  stripeCustomerId:     string
  stripeSubscriptionId: string
  status:               string
  currentPeriodEnd:     Date
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .upsert(
      {
        user_id:                params.userId,
        stripe_customer_id:     params.stripeCustomerId,
        stripe_subscription_id: params.stripeSubscriptionId,
        status:                 params.status,
        current_period_end:     params.currentPeriodEnd.toISOString(),
      },
      { onConflict: 'stripe_subscription_id' },
    )
  if (error) {
    console.error('[stripe/webhook] upsert error:', error.message)
    throw new Error(`upsert failed: ${error.message}`)
  }
}

async function updateByCustomer(params: {
  stripeCustomerId:     string
  stripeSubscriptionId: string
  status:               string
  currentPeriodEnd:     Date
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      stripe_subscription_id: params.stripeSubscriptionId,
      status:                 params.status,
      current_period_end:     params.currentPeriodEnd.toISOString(),
    })
    .eq('stripe_customer_id', params.stripeCustomerId)
  if (error) {
    console.error('[stripe/webhook] updateByCustomer error:', error.message)
    throw new Error(`update failed: ${error.message}`)
  }
}

async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', stripeSubscriptionId)
  if (error) {
    console.error('[stripe/webhook] cancel error:', error.message)
    throw new Error(`cancel failed: ${error.message}`)
  }
}

// ── main handler ──────────────────────────────────────────────────────────────

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
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe/webhook] Signature verification failed:', msg)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // Initial checkout completion: link Stripe customer to Supabase user
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId = session.metadata?.supabase_user_id
        if (!userId) {
          console.warn('[stripe/webhook] checkout.session.completed: missing supabase_user_id in metadata')
          break
        }

        const customerId     = typeof session.customer     === 'string' ? session.customer     : null
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

        if (!customerId || !subscriptionId) {
          console.warn('[stripe/webhook] checkout.session.completed: missing customer or subscription')
          break
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId)

        await upsertSubscription({
          userId,
          stripeCustomerId:     customerId,
          stripeSubscriptionId: sub.id,
          status:               sub.status,
          currentPeriodEnd:     new Date(sub.current_period_end * 1000),
        })

        console.log('[stripe/webhook] checkout.session.completed: upserted', sub.id)
        break
      }

      // Subscription created or updated (may arrive after checkout.session.completed)
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : ''
        const userId     = sub.metadata?.supabase_user_id

        if (!customerId) {
          console.warn('[stripe/webhook] subscription event: missing customer id')
          break
        }

        if (userId) {
          await upsertSubscription({
            userId,
            stripeCustomerId:     customerId,
            stripeSubscriptionId: sub.id,
            status:               sub.status,
            currentPeriodEnd:     new Date(sub.current_period_end * 1000),
          })
        } else {
          await updateByCustomer({
            stripeCustomerId:     customerId,
            stripeSubscriptionId: sub.id,
            status:               sub.status,
            currentPeriodEnd:     new Date(sub.current_period_end * 1000),
          })
        }

        console.log('[stripe/webhook] subscription updated:', sub.id, sub.status)
        break
      }

      // Subscription deleted / expired
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await cancelSubscription(sub.id)

        console.log('[stripe/webhook] subscription canceled:', sub.id)
        break
      }

      default:
        // Unhandled events are ignored; disable unused events in Stripe dashboard
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe/webhook] handler error:', msg)
    // Return 500 so Stripe retries on transient DB errors
    return NextResponse.json({ error: 'Internal handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
