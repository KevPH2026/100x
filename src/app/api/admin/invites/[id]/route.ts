import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const invite = await prisma.inviteCode.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!invite) {
      return NextResponse.json({ error: '邀请码不存在' }, { status: 404 });
    }

    if (invite.currentUses > 0) {
      return NextResponse.json({ error: '已使用的邀请码不能删除' }, { status: 400 });
    }

    await prisma.inviteCode.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/invites/[id] DELETE] error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
