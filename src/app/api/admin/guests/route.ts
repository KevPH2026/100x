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
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30));

    const [logs, total, stats] = await Promise.all([
      prisma.guestLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.guestLog.count(),
      prisma.guestLog.groupBy({
        by: ['success'],
        _count: true,
      }),
    ]);

    const totalSuccess = stats.find(s => s.success)?._count ?? 0;
    const totalFail = stats.find(s => !s.success)?._count ?? 0;

    // Unique IPs
    const uniqueIps = await prisma.guestLog.findMany({
      where: { ip: { not: null } },
      distinct: ['ip'],
      select: { ip: true },
    });

    // Recent 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24h = await prisma.guestLog.count({ where: { createdAt: { gte: dayAgo } } });

    return NextResponse.json({
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalGenerations: total,
        totalSuccess,
        totalFail,
        successRate: total > 0 ? Math.round((totalSuccess / total) * 100) : 0,
        uniqueIps: uniqueIps.length,
        last24h,
      },
    });
  } catch (error) {
    console.error('[admin/guests] error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
