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
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30));

    const where = search
      ? {
          OR: [
            { brandName: { contains: search, mode: 'insensitive' as const } },
            { industry: { contains: search, mode: 'insensitive' as const } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [brands, total] = await Promise.all([
      prisma.userBrand.findMany({
        where,
        include: {
          user: { select: { email: true, name: true, company: true } },
        },
        orderBy: { lastUsedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userBrand.count({ where }),
    ]);

    return NextResponse.json({ brands, total });
  } catch (error) {
    console.error('[admin/brands] error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
