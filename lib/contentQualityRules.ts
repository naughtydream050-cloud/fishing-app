export type ContentType = 'article' | 'spot'

export type QualityIssue = {
  field: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

export type QualityResult = {
  id: string
  contentType: ContentType
  passed: boolean
  score: number
  issues: QualityIssue[]
  recommendations: string[]
}

export const PASS_THRESHOLD = 70

type AuditableArticle = {
  id: string
  title: string
  slug: string
  summary: string
  body?: string
  imageUrl?: string
  relatedSpotIds?: string[]
  contentSource?: string
}

type AuditableSpot = {
  id: string
  name: string
  description: string
  fishTypes: string[]
  difficulty?: string
  tackle?: string
  dataSource?: string
  gearSetId?: string
}

export function checkArticleQuality(article: AuditableArticle): QualityResult {
  let score = 100
  const issues: QualityIssue[] = []
  const recommendations: string[] = []

  if (!article.body) {
    score -= 30
    issues.push({ field: 'body', severity: 'error', message: '本文（body）がありません。AI生成または手動入力が必要です。' })
    recommendations.push('本文を800文字以上で執筆してください。サマリーの展開、釣り方の詳細、季節情報を含めると良いです。')
  } else if (article.body.length < 200) {
    score -= 15
    issues.push({ field: 'body', severity: 'error', message: `本文が短すぎます（${article.body.length}文字）。200文字以上必要です。` })
    recommendations.push('本文を200文字以上に増やしてください。')
  } else if (article.body.length < 600) {
    score -= 10
    issues.push({ field: 'body', severity: 'warning', message: `本文が薄いです（${article.body.length}文字）。600文字以上を推奨します。` })
    recommendations.push('本文を600文字以上に増やしてください。具体的な釣り場情報や釣り方を追加しましょう。')
  }

  if (article.body && article.body === article.summary) {
    score -= 5
    issues.push({ field: 'body', severity: 'warning', message: '本文がサマリーと同じです。未展開の可能性があります。' })
    recommendations.push('本文をサマリーから拡張して、詳細な情報を追加してください。')
  }

  if (!article.relatedSpotIds || article.relatedSpotIds.length === 0) {
    score -= 15
    issues.push({ field: 'relatedSpotIds', severity: 'warning', message: '関連釣り場が設定されていません。' })
    recommendations.push('記事に関連する釣り場を1〜3件紐付けてください。')
  }

  if (article.imageUrl && article.imageUrl.includes('placehold.co')) {
    score -= 10
    issues.push({ field: 'imageUrl', severity: 'warning', message: 'プレースホルダー画像が使用されています。' })
    recommendations.push('実際の釣り場・釣果の画像に差し替えてください。')
  }

  if (!article.contentSource) {
    score -= 20
    issues.push({ field: 'contentSource', severity: 'error', message: 'データソース（mock/ai/cms）が未設定です。' })
    recommendations.push('contentSource を "mock", "ai", "cms" のいずれかで設定してください。')
  }

  score = Math.max(0, score)

  return {
    id: article.id,
    contentType: 'article',
    passed: score >= PASS_THRESHOLD,
    score,
    issues,
    recommendations,
  }
}

export function checkSpotQuality(spot: AuditableSpot): QualityResult {
  let score = 100
  const issues: QualityIssue[] = []
  const recommendations: string[] = []

  if (!spot.dataSource) {
    score -= 30
    issues.push({ field: 'dataSource', severity: 'error', message: 'データソース（mock/api/manual）が未設定です。' })
    recommendations.push('dataSource を "mock", "api", "manual" のいずれかで設定してください。')
  }

  if (!spot.gearSetId) {
    score -= 20
    issues.push({ field: 'gearSetId', severity: 'warning', message: '釣具セットが紐付いていません（CTA不足）。' })
    recommendations.push('釣り場に適した釣具セットを紐付けてください。')
  }

  if (spot.description.length < 50) {
    score -= 15
    issues.push({ field: 'description', severity: 'warning', message: `説明文が短いです（${spot.description.length}文字）。50文字以上推奨。` })
    recommendations.push('スポットの説明を詳しくしてください。アクセス方法、駐車場情報、注意事項などを追加しましょう。')
  }

  if (!spot.tackle || spot.tackle.trim() === '') {
    score -= 10
    issues.push({ field: 'tackle', severity: 'warning', message: 'おすすめタックル情報がありません。' })
    recommendations.push('おすすめのタックル・仕掛けを記入してください。')
  }

  if (!spot.difficulty) {
    score -= 5
    issues.push({ field: 'difficulty', severity: 'info', message: '難易度が設定されていません。' })
    recommendations.push('難易度（初心者OK/中級者向け/上級者向け）を設定してください。')
  }

  score = Math.max(0, score)

  return {
    id: spot.id,
    contentType: 'spot',
    passed: score >= PASS_THRESHOLD,
    score,
    issues,
    recommendations,
  }
}

export function auditAllContent(data: {
  articles: AuditableArticle[]
  spots: AuditableSpot[]
}): {
  totalChecked: number
  passed: number
  failed: number
  results: QualityResult[]
  summary: string
} {
  const articleResults = data.articles.map(checkArticleQuality)
  const spotResults = data.spots.map(checkSpotQuality)
  const results = [...articleResults, ...spotResults]
  const passed = results.filter(r => r.passed).length
  const failed = results.length - passed
  return {
    totalChecked: results.length,
    passed,
    failed,
    results,
    summary: `${results.length}件チェック: ${passed}件合格, ${failed}件不合格`,
  }
}
