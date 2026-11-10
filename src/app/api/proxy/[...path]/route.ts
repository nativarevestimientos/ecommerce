import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getBackendBase() {
  const raw = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
  return raw.replace(/\/+$/, '') + '/api';
}

function isAllowedPath(pathname: string): boolean {
  // Permitimos proxyear únicamente /api/proxy/carts/* para el carrito
  return pathname.startsWith('/api/proxy/carts');
}

function buildTargetUrl(req: NextRequest): string {
  const backend = getBackendBase();
  const incoming = new URL(req.url);
  const subPath = incoming.pathname.replace('/api/proxy', '');
  const qs = incoming.search;
  return `${backend}${subPath}${qs}`;
}

async function forward(req: NextRequest) {
  const targetUrl = buildTargetUrl(req);

  const headers = new Headers(req.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  headers.set('accept', 'application/json');
  const auth = req.headers.get('authorization');
  if (auth) headers.set('authorization', auth);
  headers.delete('origin');

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
    redirect: 'manual',
  };

  const res = await fetch(targetUrl, init);
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  return NextResponse.json(body, { status: res.status });
}

export async function OPTIONS(req: NextRequest) {
  if (!isAllowedPath(new URL(req.url).pathname)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(req: NextRequest) {
  if (!isAllowedPath(new URL(req.url).pathname)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return forward(req);
}

export async function POST(req: NextRequest) {
  if (!isAllowedPath(new URL(req.url).pathname)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return forward(req);
}

export async function PATCH(req: NextRequest) {
  if (!isAllowedPath(new URL(req.url).pathname)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return forward(req);
}

export async function DELETE(req: NextRequest) {
  if (!isAllowedPath(new URL(req.url).pathname)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return forward(req);
}


