import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminPassword, quota = 100, maxUses = 50, note = '', count = 1 } = body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '无权限' }, { status: 401 });
  }

  const codes = await Promise.all(
    Array.from({ length: Math.min(count, 50) }).map(() =>
      prisma.inviteCode.create({
        data: {
          code: nanoid(10).toUpperCase(),
          quota: Number(quota),
          maxUses: Number(maxUses),
          currentUses: 0,
          note: note || null,
        },
      })
    )
  );

  return NextResponse.json({ success: true, codes: codes.map(c => ({ code: c.code, quota: c.quota, maxUses: c.maxUses, note: c.note })) });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminPassword = searchParams.get('adminPassword');

  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '无权限' }, { status: 401 });
  }

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { users: { select: { email: true } } },
  });

  return NextResponse.json({ success: true, codes });
}
