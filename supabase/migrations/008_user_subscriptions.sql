-- 008_user_subscriptions.sql
-- Stripe連携用の購読管理テーブル
-- ⚠️ 本番DBへの適用は Stripe webhook 実装完了・テスト完了後に手動で行う
-- apply コマンド例: supabase db push (or Supabase MCP apply_migration)

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      text,
  stripe_subscription_id  text UNIQUE,
  status                  text NOT NULL DEFAULT 'inactive',
  -- status 候補: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'
  current_period_end      timestamptz,
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL
);

-- RLS 有効化
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のレコードのみ参照可
CREATE POLICY "users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- service_role は RLS をバイパスするため INSERT/UPDATE/DELETE ポリシー不要
-- webhook (service_role key 使用) が upsert する設計

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
  ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id
  ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
  ON user_subscriptions(status);
