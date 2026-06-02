import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) return false;
  return true;
}

// GET /api/admin/assets — 素材列表
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const search = searchParams.get('search') || '';
  const platform = searchParams.get('platform') || '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { brandName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (platform && platform !== 'all') {
    where.platform = { contains: platform, mode: 'insensitive' };
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.asset.count({ where }),
  ]);

  return NextResponse.json({
    assets,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// DELETE /api/admin/assets?id=xxx — 删除素材
export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
