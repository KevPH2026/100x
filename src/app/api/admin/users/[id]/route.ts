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
    const { quotaTotal, disabled } = body;

    const data: Record<string, unknown> = {};
    if (quotaTotal !== undefined) data.quotaTotal = Number(quotaTotal);
    if (disabled !== undefined) data.disabled = Boolean(disabled);

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
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[admin/users/[id]] error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
