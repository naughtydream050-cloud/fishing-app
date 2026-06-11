import { cookies } from 'next/headers'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabaseServer'

export type SubscriptionTier = 'free' | 'plus'

const PLUS_STATUSES = new Set(['active', 'trialing'])
export const REVIEW_PLUS_EMAIL = 'seijimimura73@gmail.com'
export const REVIEW_PLUS_COOKIE = 'review_plus_email'
const ADMIN_PLUS_EMAILS = new Set([REVIEW_PLUS_EMAIL])

async function hasReviewPlusCookie(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(REVIEW_PLUS_COOKIE)?.value === REVIEW_PLUS_EMAIL
}

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  if (await hasReviewPlusCookie()) return 'plus'

  const user = await getCurrentUser()
  if (!user) return 'free'
  if (user.email && ADMIN_PLUS_EMAILS.has(user.email.toLowerCase())) return 'plus'

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status,current_period_end')
    .eq('user_id', user.id)
    .in('status', Array.from(PLUS_STATUSES))
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error || !data || !PLUS_STATUSES.has(data.status)) return 'free'
  if (!data.current_period_end) return 'plus'

  return new Date(data.current_period_end).getTime() > Date.now() ? 'plus' : 'free'
}

export async function isPlusUser(): Promise<boolean> {
  return (await getSubscriptionTier()) === 'plus'
}

export const FREE_SPOT_LIMIT = 3
