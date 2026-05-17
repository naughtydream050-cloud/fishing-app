export type RegionId =
  | 'tokyo_23'
  | 'hiroshima'
  | 'yamaguchi'
  | 'okayama'

export type Region = {
  id: RegionId
  slug: string
  displayName: string
  prefecture: string
  lat: number
  lng: number
}

export const REGIONS: Region[] = [
  {
    id: 'tokyo_23',
    slug: 'tokyo_23',
    displayName: '東京23区',
    prefecture: '東京都',
    lat: 35.6764,
    lng: 139.6500,
  },
  {
    id: 'hiroshima',
    slug: 'hiroshima',
    displayName: '広島',
    prefecture: '広島県',
    lat: 34.3853,
    lng: 132.4553,
  },
  {
    id: 'yamaguchi',
    slug: 'yamaguchi',
    displayName: '山口',
    prefecture: '山口県',
    lat: 34.1859,
    lng: 131.4714,
  },
  {
    id: 'okayama',
    slug: 'okayama',
    displayName: '岡山',
    prefecture: '岡山県',
    lat: 34.6551,
    lng: 133.9195,
  },
]
