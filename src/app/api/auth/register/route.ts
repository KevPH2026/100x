import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readAppConfig } from '@/lib/app-config';
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

  // 读取全局默认权益配置
  const appConfig = await readAppConfig();
  const defaultQuota = appConfig.quotas?.registered?.defaultQuota ?? 10;
  const defaultValidDays = appConfig.quotas?.registered?.defaultValidDays ?? 0;

  // 检查邮箱
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  // 如果有邀请码，验证并获取配额+有效期
  let quota = defaultQuota;
  let expiresAt: Date | null = null;
  let inviteCodeId: string | undefined;

  if (inviteCode?.trim()) {
    const code = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.trim().toUpperCase() },
    });
    if (!code) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 400 });
    }
    if (code.currentUses >= code.maxUses) {
      return NextResponse.json({ error: '邀请码已用完' }, { status: 400 });
    }
    quota = code.quota || defaultQuota;
    if (code.validDays && code.validDays > 0) {
      expiresAt = new Date(Date.now() + code.validDays * 86400000);
    }
    inviteCodeId = code.id;
  } else if (defaultValidDays > 0) {
    // 无邀请码但全局配置了默认有效期
    expiresAt = new Date(Date.now() + defaultValidDays * 86400000);
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
        expiresAt,
        ...(inviteCodeId ? { inviteCode: { connect: { id: inviteCodeId } } } : {}),
      },
    });

    // 邀请码使用次数 +1
    if (inviteCodeId) {
      await tx.inviteCode.update({
        where: { id: inviteCodeId },
        data: { currentUses: { increment: 1 } },
      });
    }

    return u;
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
