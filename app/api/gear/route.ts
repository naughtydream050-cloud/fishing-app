import { NextRequest, NextResponse } from 'next/server'
import { getTrendingGears } from '@/lib/dataAccess'

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('q') ?? '釣り竿'
  try {
    const items = await getTrendingGears(keyword)
    return NextResponse.json({ keyword, count: items.length, items })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
