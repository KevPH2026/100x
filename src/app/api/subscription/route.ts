import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';

// Pricing plans — prices will be set in LemonSqueezy dashboard
// These are just for display; actual checkout is handled by LemonSqueezy
const PLANS: Record<string, { variantId: number; label: string }> = {};

// POST /api/subscription/checkout
// Creates a LemonSqueezy checkout URL
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const body = await req.json();
  const plan = body.plan || 'monthly'; // monthly | yearly
  const tier = body.tier || 'pro';

  // Check if user already has active subscription
  const existing = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ['active', 'paused', 'past_due'] } },
  });
  if (existing) {
    return NextResponse.json({
      error: '已有活跃订阅',
      subscription: existing,
    }, { status: 409 });
  }

  // Get variant IDs from AppConfig
  const config = await (await import('@/lib/app-config')).readAppConfig();
  const pricing = (config as any).pricing || {};
  const variantId = tier === 'pro'
    ? (plan === 'yearly' ? pricing.proYearlyVariantId : pricing.proMonthlyVariantId)
    : null;

  if (!variantId) {
    return NextResponse.json({
      error: '请先在LemonSqueezy配置产品，并在Admin配置中填入Variant ID',
    }, { status: 400 });
  }

  if (!LS_API_KEY || !LS_STORE_ID) {
    return NextResponse.json({
      error: 'LemonSqueezy未配置（缺少API Key或Store ID）',
    }, { status: 500 });
  }

  try {
    // Create checkout via LemonSqueezy API
    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: session.user.email,
            name: session.user.name || '',
            custom: {
              user_id: session.user.id,
              tier,
              plan,
            },
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: null,
            desc: `100x.pics ${tier.toUpperCase()} ${plan === 'yearly' ? '年付' : '月付'}`,
            enabled: true,
            recurring: true,
            redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://100x.pics'}/dashboard?sub=success`,
            receipt_link_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://100x.pics'}/dashboard?sub=receipt`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://100x.pics'}/pricing?sub=cancelled`,
          },
        },
        relationships: {
          store: {
            data: { type: 'stores', id: LS_STORE_ID },
          },
          variant: {
            data: { type: 'variants', id: String(variantId) },
          },
        },
      },
    };

    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LS_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify(checkoutData),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[LS Checkout] Error:', JSON.stringify(data));
      return NextResponse.json({ error: '创建支付失败', details: data }, { status: 500 });
    }

    const checkoutUrl = data?.data?.attributes?.url;
    if (!checkoutUrl) {
      return NextResponse.json({ error: '未获取到支付链接' }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (e: any) {
    console.error('[LS Checkout] Exception:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/subscription — current user's subscription status
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ subscribed: false, tier: 'free' });
  }

  const sub = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['active', 'paused', 'past_due'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) {
    // Check quota to determine effective tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { quotaTotal: true, quotaUsed: true, expiresAt: true },
    });
    return NextResponse.json({
      subscribed: false,
      tier: 'free',
      quotaTotal: user?.quotaTotal || 10,
      quotaUsed: user?.quotaUsed || 0,
    });
  }

  return NextResponse.json({
    subscribed: true,
    tier: sub.tier,
    plan: sub.plan,
    status: sub.status,
    renewsAt: sub.renewsAt?.toISOString() || null,
    endsAt: sub.endsAt?.toISOString() || null,
    createdAt: sub.createdAt,
    lsSubscriptionId: sub.lsSubscriptionId,
  });
}
