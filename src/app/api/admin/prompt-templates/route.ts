import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

// GET /api/admin/prompt-templates — 列表
// ?userId=xxx&brandName=xxx&scope=user|brand|user_brand
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const brandName = searchParams.get('brandName');
  const scope = searchParams.get('scope');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Number(searchParams.get('limit')) || 20);

  const where: any = {};
  if (userId) where.userId = userId;
  if (brandName) where.brandName = brandName;
  if (scope) where.scope = scope;

  const [templates, total] = await Promise.all([
    prisma.promptTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.promptTemplate.count({ where }),
  ]);

  return NextResponse.json({ templates, total });
}

// POST /api/admin/prompt-templates — 创建
// body: { userId?, brandName?, scope, label?, prompt, isActive? }
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const body = await req.json();
  const { userId, brandName, scope, label, prompt, isActive } = body;

  if (!scope || !prompt) {
    return NextResponse.json({ error: 'scope和prompt必填' }, { status: 400 });
  }

  const template = await prisma.promptTemplate.create({
    data: { userId: userId || null, brandName: brandName || null, scope, label: label || null, prompt, isActive: isActive ?? true },
  });

  return NextResponse.json(template);
}
