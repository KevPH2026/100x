import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Lightweight PV/UV tracker — called from client-side on every page load
export async function POST(req: NextRequest) {
  try {
    const { page, referrer } = await req.json();
    if (!page || typeof page !== 'string') return NextResponse.json({ ok: true });

    const session = await auth();
    const userId = session?.user?.id || null;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
    const truncatedIp = ip ? ip.split('.').slice(0, 3).join('.') + '.0' : undefined;
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) || undefined;
    const country = req.headers.get('x-vercel-ip-country') || undefined;

    // Fire-and-forget
    prisma.pageView.create({
      data: {
        page: page.slice(0, 200),
        referrer: referrer?.slice(0, 500) || null,
        ip: truncatedIp,
        userAgent,
        userId,
        country,
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never block the user
  }
}
