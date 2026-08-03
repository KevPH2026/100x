import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { quotaTotal, disabled, expiresAt, extendDays } = body;

    const data: Record<string, unknown> = {};
    if (quotaTotal !== undefined) data.quotaTotal = Number(quotaTotal);
    if (disabled !== undefined) data.disabled = Boolean(disabled);

    // Set explicit expiry date (ISO string or null to clear)
    if (expiresAt !== undefined) {
      data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    // Extend from now (e.g. { extendDays: 30 } adds 30 days to current expiry or now)
    if (extendDays !== undefined && Number(extendDays) > 0) {
      const current = await prisma.user.findUnique({ where: { id }, select: { expiresAt: true } });
      const base = current?.expiresAt && current.expiresAt > new Date() ? current.expiresAt : new Date();
      data.expiresAt = new Date(base.getTime() + Number(extendDays) * 86400000);
    }

    // Only update if there's something to update
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: '无更新字段' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        quotaTotal: true,
        quotaUsed: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[admin/users/[id]] error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
