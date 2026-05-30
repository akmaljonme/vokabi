-- subscriptions jadvaliga Stripe ustunlari qo'shish
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_key TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- user_id bo'yicha unique constraint (upsert uchun kerak)
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
