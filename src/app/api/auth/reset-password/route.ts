import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, email, newPassword } = body;

  if (!token || !email || !newPassword) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.resetToken || user.resetToken !== token) {
    return NextResponse.json({ error: '链接无效或已过期' }, { status: 400 });
  }

  if (user.resetExpAt && user.resetExpAt < new Date()) {
    // 清除过期token
    await prisma.user.update({ where: { email }, data: { resetToken: null, resetExpAt: null } });
    return NextResponse.json({ error: '链接已过期，请重新申请' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      resetToken: null,
      resetExpAt: null,
    },
  });

  return NextResponse.json({ ok: true, msg: '密码重置成功，请登录' });
}
