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
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      // Basic counts
      todayPV,
      todayUV,
      totalPV,
      totalUV,
      // Daily PV trend (30d)
      dailyPV,
      dailyUV,
      // Page distribution (7d)
      pageDist,
      // Top referrers (7d)
      topReferrers,
      // Country distribution (30d)
      countryDist,
      // Device breakdown (UA-based, 7d)
      deviceBreakdown,
      // Registered vs guest (7d)
      regVsGuest,
      // Bounce rate: sessions with only 1 page view (7d)
      singlePageSessions,
      // Unique users growth: today, yesterday, this week, last week
      yesterdayPV,
      yesterdayUV,
      thisWeekPV,
      lastWeekPV,
    ] = await Promise.all([
      // today PV
      prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
      // today UV (distinct IP)
      prisma.pageView.groupBy({ by: ['ip'], where: { createdAt: { gte: todayStart } } }),
      // total PV
      prisma.pageView.count(),
      // total UV
      prisma.pageView.groupBy({ by: ['ip'] }),
      // daily PV 30d
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count
        FROM "page_views" WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt") ORDER BY date ASC`,
      // daily UV 30d
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") AS date, COUNT(DISTINCT ip)::bigint AS count
        FROM "page_views" WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt") ORDER BY date ASC`,
      // Page distribution 7d
      prisma.pageView.groupBy({
        by: ['page'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
      }),
      // Top referrers 7d (excluding self)
      prisma.$queryRaw<{ referrer: string; count: bigint }[]>`
        SELECT referrer, COUNT(*)::bigint AS count
        FROM "page_views"
        WHERE "createdAt" >= ${sevenDaysAgo} AND referrer IS NOT NULL AND referrer NOT LIKE '%100x.pics%'
        GROUP BY referrer ORDER BY count DESC LIMIT 10`,
      // Country distribution 30d
      prisma.$queryRaw<{ country: string; count: bigint }[]>`
        SELECT country, COUNT(*)::bigint AS count
        FROM "page_views"
        WHERE "createdAt" >= ${thirtyDaysAgo} AND country IS NOT NULL
        GROUP BY country ORDER BY count DESC LIMIT 15`,
      // Device breakdown from UA (7d) — simplified
      prisma.$queryRaw<{ device: string; count: bigint }[]>`
        SELECT
          CASE
            WHEN "userAgent" LIKE '%iPhone%' OR "userAgent" LIKE '%Android%' THEN 'mobile'
            WHEN "userAgent" LIKE '%iPad%' OR "userAgent" LIKE '%Tablet%' THEN 'tablet'
            ELSE 'desktop'
          END AS device,
          COUNT(*)::bigint AS count
        FROM "page_views"
        WHERE "createdAt" >= ${sevenDaysAgo} AND "userAgent" IS NOT NULL
        GROUP BY device`,
      // Registered vs guest (7d)
      prisma.pageView.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { userId: true },
      }),
      // Single page sessions (7d) — users with exactly 1 page view by IP
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT ip FROM "page_views"
          WHERE "createdAt" >= ${sevenDaysAgo} AND ip IS NOT NULL
          GROUP BY ip HAVING COUNT(*) = 1
        ) sub`,
      // Yesterday
      prisma.pageView.count({ where: { createdAt: { gte: new Date(todayStart.getTime() - 86400000), lt: todayStart } } }),
      prisma.pageView.groupBy({ by: ['ip'], where: { createdAt: { gte: new Date(todayStart.getTime() - 86400000), lt: todayStart } } }),
      // This week (Mon-Sun)
      (() => {
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        return prisma.pageView.count({ where: { createdAt: { gte: monday } } });
      })(),
      (() => {
        const lastMonday = new Date(now);
        lastMonday.setDate(now.getDate() - 7 - ((now.getDay() + 6) % 7));
        lastMonday.setHours(0, 0, 0, 0);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        return prisma.pageView.count({ where: { createdAt: { gte: lastMonday, lt: lastSunday } } });
      })(),
    ]);

    // Computed metrics
    const bounceRate = regVsGuest.length > 0
      ? Math.round((Number(singlePageSessions[0]?.count || 0) / regVsGuest.reduce((s, g) => s + g._count.userId, 0)) * 10000) / 100
      : 0;
    const regPV = regVsGuest.filter(g => g.userId !== null).reduce((s, g) => s + g._count.userId, 0);
    const guestPV = regVsGuest.filter(g => g.userId === null).reduce((s, g) => s + g._count.userId, 0);
    const pvGrowth = yesterdayPV > 0 ? Math.round(((todayPV - yesterdayPV) / yesterdayPV) * 10000) / 100 : 0;
    const weekOverWeek = lastWeekPV > 0 ? Math.round(((thisWeekPV - lastWeekPV) / lastWeekPV) * 10000) / 100 : 0;

    return NextResponse.json({
      // Summary cards
      todayPV,
      todayUV: todayUV.length,
      totalPV,
      totalUV: totalUV.length,
      pvGrowth,         // vs yesterday
      weekOverWeek,     // vs last week
      bounceRate,
      regPV,
      guestPV,

      // Trends
      dailyPV: dailyPV.map(d => ({ date: d.date, count: Number(d.count) })),
      dailyUV: dailyUV.map(d => ({ date: d.date, count: Number(d.count) })),

      // Breakdowns
      pageDist: pageDist.map(d => ({ page: d.page, count: d._count.page })),
      topReferrers: topReferrers.map(d => ({ referrer: d.referrer, count: Number(d.count) })),
      countryDist: countryDist.map(d => ({ country: d.country, count: Number(d.count) })),
      devices: deviceBreakdown.map(d => ({ device: d.device, count: Number(d.count) })),
    });
  } catch (error) {
    console.error('[admin/analytics] error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
