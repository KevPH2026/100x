import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/quota/check
// 登录用户：检查实际配额；游客：canGenerate: true（不保存）
export async function GET() {
  const session = await auth();

  // 未登录游客：允许生成，但不保存
  if (!session?.user?.id) {
    return NextResponse.json({
      canGenerate: true,
      quotaTotal: null,
      quotaUsed: null,
      quotaRemaining: null,
      guest: true,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      quotaTotal: true,
      quotaUsed: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const quotaRemaining = Math.max(0, user.quotaTotal - user.quotaUsed);
  const canGenerate = quotaRemaining > 0;

  return NextResponse.json({
    canGenerate,
    quotaTotal: user.quotaTotal,
    quotaUsed: user.quotaUsed,
    quotaRemaining,
    guest: false,
  });
}
