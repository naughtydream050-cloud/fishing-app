---
STATUS: ACTIVE
---
# MOCK_DATA

Purpose: Development during API limits, provider downtime, or testing.
Use normalized GearPrice[] mock responses only. Never mock raw provider payloads.

## Mock Gear Items
```typescript
export const MOCK_GEAR: GearPrice[] = [
  {
    title: "シマノ ソアレ BB アジング S74UL-S",
    price: 12800,
    platform: "rakuten",
    url: "https://example.rakuten.co.jp/item/001",
    affiliateUrl: "https://example.rakuten.co.jp/item/001?af=1",
    image: "https://thumbnail.image.rakuten.co.jp/0001.jpg",
    shopName: "フィッシング山田",
    fetchedAt: "2026-05-14T00:00:00Z",
  },
  {
    title: "ダイワ レブロス LT2000S",
    price: 7980,
    platform: "yahoo",
    url: "https://store.shopping.yahoo.co.jp/item/002",
    affiliateUrl: "https://store.shopping.yahoo.co.jp/item/002?af=1",
    image: "https://shopping.c.yimg.jp/0002.jpg",
    shopName: "釣具のポイント",
    fetchedAt: "2026-05-14T00:00:00Z",
  },
]
```

## Usage
```typescript
import { MOCK_GEAR } from '@/lib/mockData'
// Use when RAKUTEN_APP_ID or YAHOO_CLIENT_ID is not set
```
