import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const is100x = host.startsWith('100x.pics') || host.startsWith('www.100x.pics');

  if (is100x) {
    const url = req.nextUrl.clone();

    // Root → landing page (internal rewrite, URL stays the same)
    if (url.pathname === '/') {
      url.pathname = '/landing';
      return NextResponse.rewrite(url);
    }

    // /get → generate tool page (真正的素材生成)
    if (url.pathname === '/get') {
      url.pathname = '/get';
      return NextResponse.next();
    }

    // Only allow specific paths, everything else → landing
    const allowed =
      url.pathname.startsWith('/adforge') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/landing') ||
      url.pathname.startsWith('/inspire') ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/register') ||
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/get') ||
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/demo/');
    if (!allowed) {
      url.pathname = '/landing';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
