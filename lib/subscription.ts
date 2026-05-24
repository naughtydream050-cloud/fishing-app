/**
 * lib/subscription.ts
 *
 * Plus（有料）プランの判定ロジック。
 * 現在は全員 free の仮実装。
 * 後で Supabase Auth + Stripe webhook に差し替える。
 *
 * 使い方:
 *   import { getSubscriptionTier } from '@/lib/subscription'
 *   const tier = await getSubscriptionTier()
 *   if (tier === 'plus') { ... }
 *
 * 注意:
 *   - 決済本番APIキーは使用しない
 *   - .env.local は読まない（将来対応）
 *   - Server Component / API Route 両方から呼べる設計
 */

export type SubscriptionTier = 'free' | 'plus'

/**
 * 現在のユーザーのサブスクリプション種別を返す。
 * TODO: Supabase Auth でセッションを取得し、
 *       stripe_subscriptions テーブルを参照する実装に差し替える。
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  // 仮実装: 常に free
  // 差し替え例:
  //   const session = await getServerSession()
  //   if (!session?.user) return 'free'
  //   const { data } = await supabase.from('subscriptions').select('status').eq('user_id', session.user.id).single()
  //   return data?.status === 'active' ? 'plus' : 'free'
  return 'free'
}

/**
 * Plus ユーザーかどうかを boolean で返す（getSubscriptionTier の薄いラッパー）。
 */
export async function isPlusUser(): Promise<boolean> {
  return (await getSubscriptionTier()) === 'plus'
}

/** 無料ユーザーに表示する上位スポット数 */
export const FREE_SPOT_LIMIT = 3
