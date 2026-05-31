import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/quota/consume
// body: { count?: number }  默认消耗 1
// 必须登录；更新 quotaUsed += count，返回最新 quota 状态
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 解析 body
  let count = 1;
  try {
    const body = await req.json();
    if (typeof body?.count === 'number' && body.count > 0) {
      count = Math.floor(body.count);
    }
  } catch {
    // body 为空或不合法时使用默认值 1
  }

  // 先查当前配额，防止超用
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { quotaTotal: true, quotaUsed: true },
  });

  if (!current) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const remaining = Math.max(0, current.quotaTotal - current.quotaUsed);
  if (remaining < count) {
    return NextResponse.json(
      {
        error: 'Insufficient quota',
        quotaTotal: current.quotaTotal,
        quotaUsed: current.quotaUsed,
        quotaRemaining: remaining,
      },
      { status: 402 }
    );
  }

  // 原子自增
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { quotaUsed: { increment: count } },
    select: { quotaTotal: true, quotaUsed: true },
  });

  const quotaRemaining = Math.max(0, updated.quotaTotal - updated.quotaUsed);

  return NextResponse.json({
    success: true,
    consumed: count,
    quotaTotal: updated.quotaTotal,
    quotaUsed: updated.quotaUsed,
    quotaRemaining,
  });
}
