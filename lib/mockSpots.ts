export type Spot = {
  id: string
  name: string
  description: string
  fishTypes: string[]
  difficulty: '初心者OK' | '中級者向け' | '上級者向け'
  bestTime: string
  tackle: string
}

export const MOCK_SPOTS: Record<string, Spot[]> = {
  hiroshima: [
    {
      id: 'port',
      name: '広島港',
      description: '広島市南区にある大型港湾。常夜灯周りでアジ・メバルが狙える人気スポット。',
      fishTypes: ['アジ', 'メバル', 'チヌ', 'タコ'],
      difficulty: '初心者OK',
      bestTime: '夕マズメ〜夜間',
      tackle: 'サビキ釣り・アジング（ジグ単1〜2g）',
    },
    {
      id: 'miyajima',
      name: '宮島沖',
      description: '世界遺産・宮島の周辺海域。潮通しがよくチヌ・アオリイカが好調。ボート釣りも人気。',
      fishTypes: ['チヌ', 'アオリイカ', 'マダイ', 'アジ'],
      difficulty: '中級者向け',
      bestTime: '朝マズメ・夕マズメ',
      tackle: 'フカセ釣り・エギング（エギ2.5〜3号）',
    },
  ],
  tokyo_23: [
    {
      id: 'sumida',
      name: '隅田川',
      description: '東京都心を流れる隅田川。橋脚周りでシーバスが回遊し、夜間は特に活性が高い。',
      fishTypes: ['シーバス', 'クロダイ', 'ハゼ'],
      difficulty: '中級者向け',
      bestTime: '夜間・大潮前後',
      tackle: 'バイブレーション（10〜14g）・ミノー',
    },
    {
      id: 'odaiba',
      name: 'お台場',
      description: '護岸整備された釣りやすいスポット。アジやサバが回遊し、ファミリーにも人気。',
      fishTypes: ['アジ', 'サバ', 'シーバス', 'ハゼ'],
      difficulty: '初心者OK',
      bestTime: '夕マズメ〜夜間',
      tackle: 'サビキ釣り・ライトタックル',
    },
  ],
  yamaguchi: [
    {
      id: 'shimono',
      name: '下関港',
      description: '関門海峡に面した港。潮流が速く、フグ・アジ・タチウオが豊富な好釣り場。',
      fishTypes: ['アジ', 'タチウオ', 'メバル', 'カサゴ'],
      difficulty: '初心者OK',
      bestTime: '夕マズメ〜夜間',
      tackle: 'サビキ釣り・テンヤ（タチウオ）',
    },
    {
      id: 'hagi',
      name: '萩漁港',
      description: '日本海に面した萩漁港。透明度が高くメバル・マダイ・アオリイカが狙える。',
      fishTypes: ['メバル', 'マダイ', 'アオリイカ', 'カサゴ'],
      difficulty: '中級者向け',
      bestTime: '夜間・早朝',
      tackle: 'メバリング（ジグ単0.8〜1.5g）・エギング',
    },
  ],
  okayama: [
    {
      id: 'kojima',
      name: '児島湖',
      description: '岡山市南部にある汽水湖。バス釣りの名所で、スポーニング期は大型狙いにチャンス。',
      fishTypes: ['ブラックバス', 'ナマズ', 'ヘラブナ'],
      difficulty: '中級者向け',
      bestTime: '朝・夕マズメ',
      tackle: 'トップウォーター・クランクベイト・ワーム',
    },
    {
      id: 'tamano',
      name: '玉野港',
      description: '瀬戸内海に面した玉野市の漁港。干満差を利用したチヌ・シーバス釣りが人気。',
      fishTypes: ['チヌ', 'シーバス', 'アジ', 'メバル'],
      difficulty: '初心者OK',
      bestTime: '満潮前後・夕マズメ',
      tackle: 'サビキ釣り・ウキフカセ・ルアー',
    },
  ],
}
