import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/** POST /api/user/brand — 创建/更新品牌档案 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { brandName, industry, style, targetAudience, colorPalette, logoUrl, notes } = body;
  if (!brandName) return NextResponse.json({ error: '品牌名必填' }, { status: 400 });

  const brand = await prisma.userBrand.upsert({
    where: { userId_brandName: { userId: session.user.id, brandName } },
    update: {
      industry: industry || undefined,
      style: style || undefined,
      targetAudience: targetAudience || undefined,
      colorPalette: colorPalette || undefined,
      logoUrl: logoUrl || undefined,
      notes: notes || undefined,
      lastUsedAt: new Date(),
    },
    create: {
      userId: session.user.id, brandName,
      industry, style, targetAudience, colorPalette, logoUrl, notes,
    },
  });

  return NextResponse.json({ ok: true, brand });
}

/** DELETE /api/user/brand?brandName=xxx */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brandName = searchParams.get('brandName');
  if (!brandName) return NextResponse.json({ error: '缺少brandName' }, { status: 400 });

  await prisma.userBrand.deleteMany({ where: { userId: session.user.id, brandName } });
  return NextResponse.json({ ok: true });
}
