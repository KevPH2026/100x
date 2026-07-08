import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // admin auth
  const token = req.cookies.get('admin_token')?.value;
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '未授权' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({ feedbacks, total, page, totalPages: Math.ceil(total / limit) });
}

// PATCH: update status
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '未授权' }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }

  await prisma.feedback.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
