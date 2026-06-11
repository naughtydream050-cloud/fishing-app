import { NextRequest, NextResponse } from 'next/server'
import { REVIEW_PLUS_COOKIE, REVIEW_PLUS_EMAIL } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const requestedEmail = requestUrl.searchParams.get('email')

  if (requestedEmail && requestedEmail !== REVIEW_PLUS_EMAIL) {
    return NextResponse.json({ error: 'review login is not allowed for this email' }, { status: 403 })
  }

  const response = NextResponse.redirect(new URL('/spots', requestUrl.origin))

  response.cookies.set(REVIEW_PLUS_COOKIE, REVIEW_PLUS_EMAIL, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
