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

    const [
      totalUsers,
      totalAssets,
      todayAssets,
      activeUserIds,
      quotaAgg,
      dailyGenerations,
      // ── 新增数据 ──
      totalGuests,
      todayGuests,
      todayGenLogs,
      successRateData,
      modelLatencyData,
      recentLogs,
      platformDist,
      topBrands,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.asset.count(),
      prisma.asset.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.findMany({
        where: { assets: { some: { createdAt: { gte: sevenDaysAgo } } } },
        select: { id: true },
      }),
      prisma.user.aggregate({ _sum: { quotaUsed: true, quotaTotal: true } }),
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count
        FROM "assets" WHERE "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE("createdAt") ORDER BY date ASC`,
      // 游客总数
      prisma.guestLog.groupBy({ by: ['ip'], }),
      // 今日游客
      prisma.guestLog.count({ where: { createdAt: { gte: todayStart } } }),
      // 今日GenerationLog总数
      prisma.generationLog.count({ where: { createdAt: { gte: todayStart } } }),
      // 近7天成功率
      prisma.generationLog.groupBy({
        by: ['success'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { success: true },
      }),
      // 模型平均延迟(最近50条)
      prisma.modelHealthLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { name: true, ok: true, latencyMs: true, type: true, createdAt: true },
      }),
      // 最近10条生成日志
      prisma.generationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, brandName: true, platform: true, imageModel: true, success: true, latencyMs: true, createdAt: true },
      }),
      // 平台分布(近7天)
      prisma.generationLog.groupBy({
        by: ['platform'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { platform: true },
      }),
      // Top品牌(近7天)
      prisma.generationLog.groupBy({
        by: ['brandName'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { brandName: true },
        orderBy: { _count: { brandName: 'desc' } },
        take: 5,
      }),
    ]);

    const activeUsers = activeUserIds.length;
    const avgPerUser = totalUsers > 0 ? Math.round((totalAssets / totalUsers) * 100) / 100 : 0;
    const quotaUsageRate = quotaAgg._sum.quotaTotal && quotaAgg._sum.quotaTotal > 0
      ? Math.round(((quotaAgg._sum.quotaUsed || 0) / quotaAgg._sum.quotaTotal) * 10000) / 100 : 0;

    // 成功率
    const successCount = successRateData.find(d => d.success === true)?._count.success || 0;
    const failCount = successRateData.find(d => d.success === false)?._count.success || 0;
    const totalGen = successCount + failCount;
    const successRate = totalGen > 0 ? Math.round((successCount / totalGen) * 10000) / 100 : 100;

    // 模型延迟(按模型名分组)
    const modelStats: Record<string, { ok: number; fail: number; avgLatency: number; lastOk: boolean; lastLatency: number }> = {};
    for (const log of modelLatencyData) {
      if (!modelStats[log.name]) modelStats[log.name] = { ok: 0, fail: 0, avgLatency: 0, lastOk: log.ok, lastLatency: log.latencyMs };
      if (log.ok) modelStats[log.name].ok++;
      else modelStats[log.name].fail++;
      modelStats[log.name].avgLatency += log.latencyMs;
    }
    for (const k of Object.keys(modelStats)) {
      const total = modelStats[k].ok + modelStats[k].fail;
      modelStats[k].avgLatency = Math.round(modelStats[k].avgLatency / total);
    }

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalAssets,
      todayAssets,
      avgPerUser,
      quotaUsageRate,
      dailyGenerations: dailyGenerations.map(d => ({ date: d.date, count: Number(d.count) })),
      // 新增
      totalGuests: totalGuests.length,
      todayGuests,
      todayGenLogs,
      successRate,
      totalGen,
      modelStats,
      recentLogs,
      platformDist: platformDist.map(d => ({ platform: d.platform || 'unknown', count: d._count.platform })),
      topBrands: topBrands.map(d => ({ brand: d.brandName, count: d._count.brandName })),
    });
  } catch (error) {
    console.error('[admin/stats] error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
