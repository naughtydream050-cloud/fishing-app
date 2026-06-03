# Subscription Readiness Report

Date: 2026-06-01
Project: fishing-app

## Result

Incomplete. Code-side subscription readiness was advanced, but production readiness is blocked until `SUPABASE_SERVICE_ROLE_KEY` is added to Vercel and a Stripe test payment is run.

## Completed

- Added Supabase SSR server client helper.
- Added Supabase Magic Link login page.
- Added `/auth/callback` code exchange route.
- Changed `/signup` to use the real login flow instead of the previous local-only form.
- Changed Checkout API to redirect unauthenticated users to `/login?next=/subscribe`.
- Added `client_reference_id`, Checkout metadata, and subscription metadata with the Supabase user id.
- Updated Stripe webhook subscription events to upsert when subscription metadata contains `supabase_user_id`.
- Implemented Plus判定 from `user_subscriptions` rows with `active` or `trialing` status and non-expired period.
- Added Supabase auth session refresh proxy.

## Verified

- `npm run build`: passed.
- `npm run lint`: passed after build.
- Local server: `http://localhost:3000`.
- `POST /api/stripe/create-checkout-session` without login returns `303` to `/login?next=/subscribe`.
- `/login?next=/subscribe` renders an email input and next hidden field.
- `/spots` renders the free-user locked state and subscribe link.
- Vercel env names confirmed without values:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PLUS_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`

## Blockers

- Vercel is missing `SUPABASE_SERVICE_ROLE_KEY`.
- Local `.env.local` resolves Supabase URL to a placeholder, so local DB read verification could not run.
- Stripe test payment was not run because webhook DB writes are not production-ready without the service-role env.
- `user_subscriptions` update is not confirmed in this session.

## Remaining Completion Conditions

- Stripe test決済成功: not done.
- `user_subscriptions`更新確認: not done.
- Plus判定実装: done.
- 有料ページ解放: code path done; live Plus account verification not done.
- E2E確認: partial local HTTP E2E done; full Stripe E2E not done.
- 最終レポート作成: this report is an interim readiness report, not final completion.

## Next Action

Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel Preview and Production without exposing the value, then deploy after review and run a Stripe test checkout.
