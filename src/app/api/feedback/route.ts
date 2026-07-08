import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, page, contact } = body;

    if (!content?.trim() || content.length > 2000) {
      return NextResponse.json({ error: '反馈内容不能为空或超过2000字' }, { status: 400 });
    }

    // XSS过滤：strip HTML tags
    const sanitized = content.trim().replace(/<[^>]*>/g, '').replace(/[<>'"&]/g, '');
    if (!sanitized) {
      return NextResponse.json({ error: '反馈内容不能为空' }, { status: 400 });
    }
    const sanitizedContact = contact?.trim().replace(/<[^>]*>/g, '').replace(/[<>'"&]/g, '') || null;

    // 收集用户身份
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id || null;
    } catch {}

    // IP（未登录用户兜底）
    let ip: string | null = null;
    if (!userId) {
      const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
      ip = rawIp ? rawIp.replace(/\.\d+$/, '.0') : null;
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        ip,
        page: page || '/',
        content: sanitized,
        contact: sanitizedContact,
      },
    });

    return NextResponse.json({ ok: true, id: feedback.id });
  } catch (error) {
    console.error('[feedback] error:', error);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}
