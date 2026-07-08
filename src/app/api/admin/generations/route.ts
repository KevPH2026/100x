import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '20'));
  const userId = url.searchParams.get('userId') || null;
  const brandName = url.searchParams.get('brandName') || null;
  const success = url.searchParams.get('success');

  const where: any = {};
  if (userId) where.userId = userId;
  if (brandName) where.brandName = { contains: brandName, mode: 'insensitive' };
  if (success === 'true') where.success = true;
  if (success === 'false') where.success = false;

  const [logs, total] = await Promise.all([
    prisma.generationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, userId: true, ip: true, brandName: true,
        prompt: true, sceneLabel: true, sceneDesc: true,
        aspectRatio: true, platform: true, style: true, mood: true,
        targetCountry: true, imageModel: true, imageUrl: true,
        success: true, error: true, latencyMs: true, workflow: true,
        createdAt: true,
      },
    }),
    prisma.generationLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
