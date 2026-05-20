---
STATUS: STABLE
---
# API_CONTRACT

## Unified Gear Type
```typescript
type GearPrice = {
  title: string
  price: number
  platform: "rakuten" | "yahoo"
  url: string
  affiliateUrl: string
  image?: string
  shopName: string
  fetchedAt: string
}
```

## Rules
- API routes return ONLY normalized GearPrice[]
- No raw provider payloads to frontend
- Frontend must never know provider-specific structure
- Provider logic stays isolated in lib/rakuten.ts and lib/yahoo.ts

## Endpoints
GET /api/gear?q={keyword}
- Returns: { keyword, count, items: GearPrice[] }
- Caching: 1 hour (revalidate: 3600)
- Source: Rakuten + Yahoo parallel fetch, normalized, price-sorted

GET /api/gear/trending
- Returns: { items: GearPrice[] }
- Source: Supabase cache, last 20 items
- Does NOT hit external APIs
