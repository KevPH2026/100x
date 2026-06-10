import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) return false;
  return true;
}

// GET /api/admin/assets — 素材列表（支持userId过滤+客户聚合）
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const search = searchParams.get('search') || '';
  const platform = searchParams.get('platform') || '';
  const userId = searchParams.get('userId') || '';
  const groupByUser = searchParams.get('groupByUser') === 'true';

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { brandName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (platform && platform !== 'all') {
    where.platform = { contains: platform, mode: 'insensitive' };
  }

  // 按客户聚合模式
  if (groupByUser) {
    const users = await prisma.user.findMany({
      where: search ? { email: { contains: search, mode: 'insensitive' } } : {},
      select: {
        id: true, email: true, name: true, company: true,
        _count: { select: { assets: true, brands: true } },
        assets: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
      orderBy: { assets: { _count: 'desc' } },
    });
    const clients = users.filter(u => u._count.assets > 0).map(u => ({
      id: u.id, email: u.email, name: u.name, company: u.company,
      assetCount: u._count.assets, brandCount: u._count.brands,
      lastActive: u.assets[0]?.createdAt || null,
    }));
    return NextResponse.json({ clients, total: clients.length });
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { user: { select: { email: true, name: true, company: true } } },
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
