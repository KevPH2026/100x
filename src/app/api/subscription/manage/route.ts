import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';

// POST /api/subscription/manage — cancel, pause, resume
// body: { action: 'cancel' | 'pause' | 'resume' }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const body = await req.json();
  const action = body.action; // cancel | pause | resume

  if (!['cancel', 'pause', 'resume'].includes(action)) {
    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  }

  const sub = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['active', 'paused', 'past_due'] },
    },
  });

  if (!sub) {
    return NextResponse.json({ error: '无活跃订阅' }, { status: 404 });
  }

  if (!LS_API_KEY) {
    // Mock mode: 直接更新本地DB
    const statusMap: Record<string, string> = { cancel: 'cancelled', pause: 'paused', resume: 'active' };
    const newStatus = statusMap[action] || 'active';
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        endsAt: action === 'cancel' ? new Date(Date.now() + 30 * 86400000) : undefined,
      },
    });

    // If cancelled, revert quota to free tier
    if (action === 'cancel') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { quotaTotal: 10 },
      });
    }

    return NextResponse.json({ ok: true, status: newStatus, mock: true });
  }

  try {
    // Call LemonSqueezy API to change subscription
    const updateData: Record<string, any> = {};

    if (action === 'cancel') {
      updateData.cancel = true;
    } else if (action === 'pause') {
      updateData.paused = true;
    } else if (action === 'resume') {
      updateData.cancelled = false;
      updateData.paused = false;
    }

    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${sub.lsSubscriptionId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${LS_API_KEY}`,
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
        body: JSON.stringify({
          data: {
            type: 'subscriptions',
            id: sub.lsSubscriptionId,
            attributes: updateData,
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error(`[LS Manage] ${action} error:`, JSON.stringify(data));
      return NextResponse.json({ error: '操作失败', details: data }, { status: 500 });
    }

    // Update local DB
    const attrs = data?.data?.attributes || {};
    const newStatus = attrs?.status || (action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'active');

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        endsAt: attrs.ends_at ? new Date(attrs.ends_at) : (action === 'cancel' ? new Date(Date.now() + 30 * 86400000) : undefined),
        renewsAt: attrs.renews_at ? new Date(attrs.renews_at) : undefined,
      },
    });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/subscription/manage — get billing portal URL
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // LemonSqueezy doesn't have a separate portal like Stripe.
  // Instead, users manage via the subscription's update URL or we provide self-service.
  // Return subscription info for client-side management
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    hasSubscription: !!sub,
    subscription: sub ? {
      id: sub.id,
      status: sub.status,
      tier: sub.tier,
      plan: sub.plan,
      renewsAt: sub.renewsAt?.toISOString() || null,
      endsAt: sub.endsAt?.toISOString() || null,
    } : null,
  });
}
