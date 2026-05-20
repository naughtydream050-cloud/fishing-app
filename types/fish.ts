export type FishId =
  | 'seabass'
  | 'aji'
  | 'mebaru'
  | 'black_bass'

export type FishSpecies = {
  id: FishId
  slug: string
  displayName: string
  category: 'saltwater' | 'freshwater'
  seasonTags: string[]
}

export const FISH_SPECIES: FishSpecies[] = [
  {
    id: 'seabass',
    slug: 'seabass',
    displayName: 'シーバス',
    category: 'saltwater',
    seasonTags: ['spring', 'summer', 'autumn'],
  },
  {
    id: 'aji',
    slug: 'aji',
    displayName: 'アジ',
    category: 'saltwater',
    seasonTags: ['spring', 'summer'],
  },
  {
    id: 'mebaru',
    slug: 'mebaru',
    displayName: 'メバル',
    category: 'saltwater',
    seasonTags: ['winter', 'spring'],
  },
  {
    id: 'black_bass',
    slug: 'black_bass',
    displayName: 'ブラックバス',
    category: 'freshwater',
    seasonTags: ['spring', 'summer', 'autumn'],
  },
]
