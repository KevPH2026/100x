import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

// PATCH /api/admin/prompt-templates/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.prompt !== undefined) data.prompt = body.prompt;
  if (body.label !== undefined) data.label = body.label;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '无更新字段' }, { status: 400 });
  }

  const template = await prisma.promptTemplate.update({ where: { id }, data });
  return NextResponse.json(template);
}

// DELETE /api/admin/prompt-templates/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { id } = await params;
  await prisma.promptTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
