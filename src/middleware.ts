import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const is100x = host.startsWith('100x.pics') || host.startsWith('www.100x.pics');
  const is100pics = host.startsWith('100pics.today') || host.startsWith('www.100pics.today');

  // Both domains share the same app now — page.tsx (HomePage) is the root
  // Only restrict unknown paths on 100x.pics
  if (is100x && url.pathname !== '/') {
    const allowed =
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/inspire') ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/register') ||
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/get') ||
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/demo/');
    if (!allowed) {
      url.pathname = '/';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
