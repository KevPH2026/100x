import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/user/memory — 读取所有偏好+品牌档案 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const [memories, brands] = await Promise.all([
    prisma.userMemory.findMany({
      where: { userId: session.user.id },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    }),
    prisma.userBrand.findMany({
      where: { userId: session.user.id },
      orderBy: { usageCount: 'desc' },
    }),
  ]);

  return NextResponse.json({ memories, brands });
}

/** POST /api/user/memory — 写入/更新偏好 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { category, key, value, source } = body;
  if (!category || !key || !value) return NextResponse.json({ error: '参数不全' }, { status: 400 });

  const mem = await prisma.userMemory.upsert({
    where: { userId_category_key: { userId: session.user.id, category, key } },
    update: { value, source: source || 'manual', updatedAt: new Date() },
    create: { userId: session.user.id, category, key, value, source: source || 'manual' },
  });

  return NextResponse.json({ ok: true, memory: mem });
}

/** DELETE /api/user/memory — 删除偏好 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少id' }, { status: 400 });

  await prisma.userMemory.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
