import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const TIER_LIMITS: Record<string, number> = { free: 10, pro: 500, team: 2000 };

// GET /api/quota/check
export async function GET() {
  const session = await auth();

  // Guest
  if (!session?.user?.id) {
    return NextResponse.json({ canGenerate: true, quotaTotal: null, quotaUsed: null, quotaRemaining: null, guest: true, tier: 'free' });
  }

  // Check active subscription
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ['active', 'paused', 'past_due'] } },
    select: { tier: true, status: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { quotaTotal: true, quotaUsed: true, expiresAt: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const tier = sub?.tier || 'free';

  // Pro+ users: if expired/cancelled, fall back to free
  if (sub && sub.status === 'past_due') {
    // Allow generation but show warning
    const remaining = Math.max(0, user.quotaTotal - user.quotaUsed);
    return NextResponse.json({ canGenerate: remaining > 0, quotaTotal: user.quotaTotal, quotaUsed: user.quotaUsed, quotaRemaining: remaining, tier, status: 'past_due', expiresAt: user.expiresAt?.toISOString() || null, guest: false });
  }

  // Check expiry (free tier only)
  if (user.expiresAt && user.expiresAt < new Date() && !sub) {
    return NextResponse.json({ canGenerate: false, quotaTotal: user.quotaTotal, quotaUsed: user.quotaUsed, quotaRemaining: 0, expired: true, expiresAt: user.expiresAt.toISOString(), tier: 'free', guest: false });
  }

  const quotaRemaining = Math.max(0, user.quotaTotal - user.quotaUsed);
  return NextResponse.json({ canGenerate: quotaRemaining > 0, quotaTotal: user.quotaTotal, quotaUsed: user.quotaUsed, quotaRemaining, tier, expiresAt: user.expiresAt?.toISOString() || null, guest: false });
}
