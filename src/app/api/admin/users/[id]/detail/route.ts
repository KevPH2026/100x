import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      inviteCode: true,
      brands: { orderBy: { lastUsedAt: 'desc' } },
      memories: { orderBy: { updatedAt: 'desc' } },
      assets: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const { password: _, ...safeUser } = user;

  const [totalAssets, totalBrands, totalMemories] = await Promise.all([
    prisma.asset.count({ where: { userId: id } }),
    prisma.userBrand.count({ where: { userId: id } }),
    prisma.userMemory.count({ where: { userId: id } }),
  ]);

  return NextResponse.json({
    user: safeUser,
    registration: {
      company: user.company,
      phone: user.phone,
      createdAt: user.createdAt,
      inviteCode: user.inviteCode ? {
        code: user.inviteCode.code,
        quota: user.inviteCode.quota,
        maxUses: user.inviteCode.maxUses,
        currentUses: user.inviteCode.currentUses,
      } : null,
    },
    brands: user.brands,
    memories: user.memories,
    recentAssets: user.assets,
    quota: {
      total: user.quotaTotal,
      used: user.quotaUsed,
      remaining: Math.max(0, user.quotaTotal - user.quotaUsed),
      usageRate: user.quotaTotal > 0 ? Math.round((user.quotaUsed / user.quotaTotal) * 10000) / 100 : 0,
    },
    stats: { totalAssets, totalBrands, totalMemories },
  });
}
