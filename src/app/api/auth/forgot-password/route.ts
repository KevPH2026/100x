import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '请输入有效邮箱' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // 无论用户是否存在，都返回成功（防止枚举邮箱）
  if (!user) {
    return NextResponse.json({ ok: true, msg: '如果该邮箱已注册，重置链接已发送' });
  }

  // 生成重置token（32位hex），1小时过期
  const token = crypto.randomBytes(16).toString('hex');
  const expAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { resetToken: token, resetExpAt: expAt },
  });

  // 发邮件
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://100x.pics'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: '100x <noreply@100x.pics>',
        to: email,
        subject: '重置你的100x密码',
        html: `
          <div style="max-width:480px;margin:0 auto;padding:32px;font-family:system-ui,sans-serif;color:#1a1a2e;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:16px;background:linear-gradient(135deg,#8b5cf6,#6366f1);">
                <span style="color:#fff;font-size:14px;font-weight:900;">100x</span>
              </div>
            </div>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">重置密码</h2>
            <p style="color:#666;margin-bottom:24px;">点击下方按钮重置你的密码（链接1小时内有效）：</p>
            <a href="${resetUrl}" style="display:block;width:100%;padding:14px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;text-align:center;font-weight:600;text-decoration:none;font-size:14px;">
              重置密码
            </a>
            <p style="color:#999;font-size:12px;margin-top:20px;text-align:center;">如果这不是你的操作，请忽略此邮件。</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('[forgot-password] email send error:', e);
    }
  }

  return NextResponse.json({ ok: true, msg: '如果该邮箱已注册，重置链接已发送' });
}
