import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  if (!ADMIN_PASSWORD) return false;
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

// GET: 查询交互日志（支持分页、按traceId、按用户、按step筛选）
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const traceId = url.searchParams.get('traceId') || undefined;
  const userId = url.searchParams.get('userId') || undefined;
  const step = url.searchParams.get('step') || undefined;
  const reviewFlag = url.searchParams.get('reviewFlag') || undefined;
  const source = url.searchParams.get('source') || undefined;

  const where: Record<string, unknown> = {};
  if (traceId) where.traceId = traceId;
  if (userId) where.userId = userId;
  if (step) where.step = step;
  if (reviewFlag) where.reviewFlag = reviewFlag;
  if (source) where.source = source;

  const [logs, total] = await Promise.all([
    prisma.interactionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.interactionLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST: 自审查 — 标记日志问题
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { logId, flag, note } = await req.json();
  if (!logId) return NextResponse.json({ error: 'logId required' }, { status: 400 });

  await prisma.interactionLog.update({
    where: { id: logId },
    data: {
      reviewFlag: flag || 'warning',
      reviewNote: note || '',
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE: 批量清理旧日志（保留最近30天）
export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.interactionLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: result.count });
}
