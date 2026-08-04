import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LS_SIGNING_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';

// Verify LemonSqueezy webhook signature
async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!LS_SIGNING_SECRET) return true; // dev mode
  try {
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', LS_SIGNING_SECRET);
    hmac.update(body);
    const digest = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

// LemonSqueezy webhook events
// https://docs.lemonsqueezy.com/api/webhooks
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const sig = req.headers.get('x-signature') || '';

    // Verify signature
    if (LS_SIGNING_SECRET && !(await verifySignature(rawBody, sig))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const eventName = body.meta?.event_name;
    const attrs = body.data?.attributes;

    console.log(`[LS Webhook] event=${eventName} id=${attrs?.id || '-'}`);

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionEvent(attrs, eventName === 'subscription_created' ? 'created' : 'updated');
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(attrs);
        break;

      case 'subscription_expired':
        await handleSubscriptionExpired(attrs);
        break;

      case 'subscription_paused':
        await handleSubscriptionPaused(attrs);
        break;

      case 'subscription_resumed':
        await handleSubscriptionResumed(attrs);
        break;

      case 'subscription_payment_success':
        await handlePaymentSuccess(attrs);
        break;

      case 'subscription_payment_failed':
        await handlePaymentFailed(attrs);
        break;

      case 'order_created':
        await handleOrderCreated(body.data?.attributes);
        break;

      default:
        console.log(`[LS Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(`[LS Webhook] Error:`, e.message || e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Handlers ──────────────────────────────────────────────────

async function handleSubscriptionEvent(attrs: any, type: 'created' | 'updated') {
  const email = attrs?.user_email || attrs?.customer_email || '';
  const lsSubId = String(attrs?.subscription_id || attrs?.id || '');
  const orderId = String(attrs?.order_id || attrs?.order_id || '');
  const productId = attrs?.variant_id || attrs?.product_id;
  const status = attrs?.status || 'active';
  const renewsAt = attrs?.renews_at;
  const endsAt = attrs?.ends_at;
  const plan = attrs?.trial_ends_at ? 'trial' : (productId === 'monthly' || attrs?.billing_anchor === 30 ? 'monthly' : 'yearly');

  // Determine tier from product/variant
  const tier = detectTier(productId, attrs);

  // Find user by email (LemonSqueezy sends email)
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`[LS Webhook] User not found for email: ${email}`);
    // Create subscription record anyway (user might register later)
    // We'll link it when they register
    return;
  }

  if (type === 'created') {
    await prisma.subscription.upsert({
      where: { lsSubscriptionId: lsSubId },
      create: {
        userId: user.id,
        lsSubscriptionId: lsSubId,
        lsOrderId: orderId,
        lsProductId: productId,
        status,
        tier,
        plan,
        renewsAt: renewsAt ? new Date(renewsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
      update: {
        status,
        tier,
        renewsAt: renewsAt ? new Date(renewsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    // Upgrade user quota for Pro
    await upgradeUserQuota(user.id, tier);
  } else {
    // Updated
    await prisma.subscription.update({
      where: { lsSubscriptionId: lsSubId },
      data: {
        status,
        lsOrderId: orderId,
        renewsAt: renewsAt ? new Date(renewsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });
  }
}

async function handleSubscriptionCancelled(attrs: any) {
  const lsSubId = String(attrs?.subscription_id || attrs?.id || '');
  const endsAt = attrs?.ends_at || attrs?.trial_ends_at;

  await prisma.subscription.update({
    where: { lsSubscriptionId: lsSubId },
    data: {
      status: 'cancelled',
      endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 30 * 86400000), // access until end of billing
    },
  });
}

async function handleSubscriptionExpired(attrs: any) {
  const lsSubId = String(attrs?.subscription_id || attrs?.id || '');

  const sub = await prisma.subscription.findUnique({ where: { lsSubscriptionId: lsSubId } });
  if (sub) {
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'expired', endsAt: new Date() } });
    // Revert user quota to free tier
    await revertUserQuota(sub.userId);
  }
}

async function handleSubscriptionPaused(attrs: any) {
  const lsSubId = String(attrs?.subscription_id || attrs?.id || '');
  const resumesAt = attrs?.resumes_at;

  await prisma.subscription.update({
    where: { lsSubscriptionId: lsSubId },
    data: { status: 'paused', renewsAt: resumesAt ? new Date(resumesAt) : null },
  });
}

async function handleSubscriptionResumed(attrs: any) {
  const lsSubId = String(attrs?.subscription_id || attrs?.id || '');
  const renewsAt = attrs?.renews_at;

  await prisma.subscription.update({
    where: { lsSubscriptionId: lsSubId },
    data: { status: 'active', renewsAt: renewsAt ? new Date(renewsAt) : null },
  });
}

async function handlePaymentSuccess(attrs: any) {
  // Renewal payment succeeded — extend renewsAt
  const lsSubId = String(attrs?.subscription_id || attrs?.id || '');
  const renewsAt = attrs?.renews_at;

  if (renewsAt) {
    await prisma.subscription.update({
      where: { lsSubscriptionId: lsSubId },
      data: { status: 'active', renewsAt: new Date(renewsAt) },
    });
  }
}

async function handlePaymentFailed(attrs: any) {
  const lsSubId = String(attrs?.subscription_id || attrs?.id || '');

  await prisma.subscription.update({
    where: { lsSubscriptionId: lsSubId },
    data: { status: 'past_due' },
  });
}

async function handleOrderCreated(attrs: any) {
  // Order created — just log for analytics
  console.log(`[LS Webhook] Order: ${attrs?.order_number || attrs?.id} total=${attrs?.total}`);
}

// ── Helpers ──────────────────────────────────────────────────

function detectTier(productId: any, attrs: any): string {
  // Default to pro; can add more tiers later
  return 'pro';
}

const TIER_QUOTAS: Record<string, number> = {
  free: 10,
  pro: 500,
  team: 2000,
};

async function upgradeUserQuota(userId: string, tier: string) {
  const quota = TIER_QUOTAS[tier] || 500;
  await prisma.user.update({
    where: { id: userId },
    data: {
      quotaTotal: quota,
      expiresAt: null, // Pro users don't expire
    },
  });
  console.log(`[LS Webhook] Upgraded user ${userId} to ${tier} (quota: ${quota})`);
}

async function revertUserQuota(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { quotaTotal: 10 },
  });
  console.log(`[LS Webhook] Reverted user ${userId} to free tier (quota: 10)`);
}

// GET: Test endpoint
export async function GET() {
  return NextResponse.json({
    status: 'webhook ready',
    hasKey: !!LS_API_KEY,
    hasSecret: !!LS_SIGNING_SECRET,
    hasStore: !!LS_STORE_ID,
  });
}
