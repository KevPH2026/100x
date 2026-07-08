import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';

  // www → non-www 301 redirect
  if (host.startsWith('www.')) {
    const url = req.nextUrl.clone();
    url.protocol = 'https:';
    url.host = host.replace('www.', '');
    return NextResponse.redirect(url, 301);
  }

  const is100x = host.startsWith('100x.pics');

  if (is100x) {
    const url = req.nextUrl.clone();

    // Root → landing page (internal rewrite, URL stays the same)
    if (url.pathname === '/') {
      url.pathname = '/landing';
      return NextResponse.rewrite(url);
    }

    // /get → generate tool page
    if (url.pathname === '/get') {
      url.pathname = '/get';
      return NextResponse.next();
    }

    // Allow static files (images, icons, etc.)
    const isStatic = /\.(jpg|jpeg|png|webp|svg|gif|ico|css|js|woff2?|ttf|mp4|webm|mp3|pdf)$/.test(url.pathname);
    if (isStatic) return NextResponse.next();

    // Only allow specific paths, everything else → landing
    const allowed =
      url.pathname.startsWith('/adforge') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/landing') ||
      url.pathname.startsWith('/inspire') ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/reset-password') ||
      url.pathname.startsWith('/register') ||
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/chat') ||
      url.pathname.startsWith('/get') ||
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/demo/') ||
      url.pathname.startsWith('/design-') ||
      url.pathname.startsWith('/style-imgs/');
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
