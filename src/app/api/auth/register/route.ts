import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, inviteCode, name } = body;

  if (!email || !password || !inviteCode) {
    return NextResponse.json({ error: '邮箱、密码和邀请码必填' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: '密码至少8位' }, { status: 400 });
  }

  // 验证邀请码
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

  // 检查邮箱是否已注册
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  // 事务：创建用户 + 标记邀请码已使用
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email,
        password: hashed,
        name: name || email.split('@')[0],
        quotaTotal: code.quota,
        quotaUsed: 0,
      },
    });

    await tx.inviteCode.update({
      where: { id: code.id },
      data: {
        usedBy: { connect: { id: u.id } },
        usedAt: new Date(),
      },
    });

    return u;
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, quotaTotal: user.quotaTotal },
  });
}
