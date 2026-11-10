import { NextResponse } from 'next/server'

function resolveSiteBaseUrl(request: Request) {
  const rawEnv = (process.env.NEXT_PUBLIC_BASE_URL || '').trim()
  if (rawEnv) return rawEnv.replace(/\/+$/, '')
  return new URL(request.url).origin
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/?login=open', resolveSiteBaseUrl(request)))
}

export async function POST(request: Request) {
  return NextResponse.redirect(new URL('/?login=open', resolveSiteBaseUrl(request)))
}
