'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    if (!pathname || pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    // Normalize: middleware rewrites / to /landing internally, track what user sees
    const page = pathname === '/' ? '/landing' : pathname;

    // Fire-and-forget via sendBeacon for reliability
    const payload = JSON.stringify({
      page,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });

    // Use sendBeacon if available (survives page unload), fallback to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/pageview', payload);
    } else {
      fetch('/api/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
