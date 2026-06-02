import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET — 邀请码列表
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const search = searchParams.get('search')?.trim() || '';

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { note: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [invites, total] = await Promise.all([
      prisma.inviteCode.findMany({
        where,
        select: {
          id: true,
          code: true,
          quota: true,
          note: true,
          usedAt: true,
          createdAt: true,
          usedBy: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inviteCode.count({ where }),
    ]);

    const invitesWithUserEmail = invites.map((inv) => ({
      ...inv,
      userEmail: inv.usedBy?.email ?? null,
      usedBy: undefined,
    }));

    return NextResponse.json({
      invites: invitesWithUserEmail,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[admin/invites GET] error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST — 批量生成邀请码
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const count = Math.min(100, Math.max(1, Number(body.count) || 1));
    const quota = Number(body.quota) || 100;
    const notePrefix = body.notePrefix || '';

    const codes: string[] = [];
    const data: { code: string; quota: number; note: string | null }[] = [];

    for (let i = 0; i < count; i++) {
      let code = generateCode();
      // 确保不重复
      let exists = await prisma.inviteCode.findUnique({ where: { code } });
      while (exists) {
        code = generateCode();
        exists = await prisma.inviteCode.findUnique({ where: { code } });
      }
      codes.push(code);
      data.push({
        code,
        quota,
        note: notePrefix ? `${notePrefix}-${i + 1}` : null,
      });
    }

    await prisma.inviteCode.createMany({ data });

    return NextResponse.json({ codes, count: codes.length });
  } catch (error) {
    console.error('[admin/invites POST] error:', error);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
