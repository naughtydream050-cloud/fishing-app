/**
 * Paywall feature module
 * All paywall logic is isolated here.
 * UI components import from @/features/paywall — never inline paywall logic.
 */

export const PAYWALL_CONFIG = {
  freeViewLimit: 2,          // views before paywall triggers
  monthlyPrice: 400,         // JPY
  stripeCheckoutUrl: '',     // TODO: add Stripe checkout URL
} as const

export type PaywallState = {
  viewCount: number
  isBlocked: boolean
}

export function getPaywallState(): PaywallState {
  if (typeof window === 'undefined') return { viewCount: 0, isBlocked: false }
  const count = parseInt(sessionStorage.getItem('viewCount') ?? '0', 10)
  return { viewCount: count, isBlocked: count >= PAYWALL_CONFIG.freeViewLimit }
}

export function incrementViewCount(): PaywallState {
  if (typeof window === 'undefined') return { viewCount: 0, isBlocked: false }
  const count = parseInt(sessionStorage.getItem('viewCount') ?? '0', 10) + 1
  sessionStorage.setItem('viewCount', String(count))
  return { viewCount: count, isBlocked: count > PAYWALL_CONFIG.freeViewLimit }
}
