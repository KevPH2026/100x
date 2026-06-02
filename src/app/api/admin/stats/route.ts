import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 并行查询所有数据
    const [
      totalUsers,
      totalAssets,
      todayAssets,
      activeUserIds,
      quotaAgg,
      dailyGenerations,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.asset.count(),

      prisma.asset.count({
        where: { createdAt: { gte: todayStart } },
      }),

      // 7天内有asset的活跃用户
      prisma.user.findMany({
        where: {
          assets: { some: { createdAt: { gte: sevenDaysAgo } } },
        },
        select: { id: true },
      }),

      // 配额使用率
      prisma.user.aggregate({
        _sum: { quotaUsed: true, quotaTotal: true },
      }),

      // 最近7天每日生成量
      prisma.$queryRaw<
        { date: string; count: bigint }[]
      >`SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count FROM "assets" WHERE "createdAt" >= ${sevenDaysAgo} GROUP BY DATE("createdAt") ORDER BY date ASC`,
    ]);

    const activeUsers = activeUserIds.length;
    const avgPerUser =
      totalUsers > 0 ? Math.round((totalAssets / totalUsers) * 100) / 100 : 0;
    const quotaUsageRate =
      quotaAgg._sum.quotaTotal && quotaAgg._sum.quotaTotal > 0
        ? Math.round(
            ((quotaAgg._sum.quotaUsed || 0) / quotaAgg._sum.quotaTotal) * 10000
          ) / 100
        : 0;

    const daily = dailyGenerations.map((d) => ({
      date: d.date,
      count: Number(d.count),
    }));

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalAssets,
      todayAssets,
      avgPerUser,
      quotaUsageRate,
      dailyGenerations: daily,
    });
  } catch (error) {
    console.error('[admin/stats] error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
