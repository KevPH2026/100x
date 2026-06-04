import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, name, company, phone, inviteCode } = body;

  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
  }

  // 检查邮箱
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  // 如果有邀请码，验证并获取配额
  let quota = 10; // 默认免费配额
  let inviteCodeId: string | undefined;

  if (inviteCode?.trim()) {
    const code = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.trim().toUpperCase() },
      include: { usedBy: true },
    });
    if (!code) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 400 });
    }
    if (code.usedBy) {
      return NextResponse.json({ error: '邀请码已被使用' }, { status: 400 });
    }
    quota = code.quota || 100;
    inviteCodeId = code.id;
  }

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email,
        password: hashed,
        name: name || null,
        company: company || null,
        phone: phone || null,
        quotaTotal: quota,
        quotaUsed: 0,
        ...(inviteCodeId ? { inviteCode: { connect: { id: inviteCodeId } } } : {}),
      },
    });

    // 标记邀请码已使用
    if (inviteCodeId) {
      await tx.inviteCode.update({
        where: { id: inviteCodeId },
        data: { usedBy: { connect: { id: u.id } }, usedAt: new Date() },
      });
    }

    return u;
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
