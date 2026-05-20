---
STATUS: STABLE
---
# DB_SCHEMA

## Tables

### gear_prices
Primary cache table for fetched prices.

| Column       | Type        | Notes                          |
|-------------|-------------|-------------------------------|
| id          | uuid PK     | gen_random_uuid()             |
| gear_name   | text        | Search keyword used            |
| shop        | text        | 'rakuten' or 'yahoo'          |
| price       | integer     | Price in JPY                  |
| url         | text        | Product page URL              |
| affiliate_url | text      | Affiliate-tracked URL         |
| image_url   | text        | Product thumbnail              |
| shop_name   | text        | Retailer name                 |
| fetched_at  | timestamptz | Auto: now()                   |

Unique constraint: (gear_name, shop, shop_name)

## Query Rules
- Use Supabase SQL directly (no ORM)
- Lightweight queries only
- Index on: gear_name, price, fetched_at

## Phase 1 Only
No user tables yet.
No auth tables yet.
No favorites/alerts tables yet (Phase 2).

## Migration Files
001_gear.sql — gear_prices table (created)
