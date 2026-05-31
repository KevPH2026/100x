import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      quotaTotal: true,
      quotaUsed: true,
      assets: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          imageUrl: true,
          brandName: true,
          platform: true,
          sceneLabel: true,
          aspectRatio: true,
          headline: true,
          sourceUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const quotaRemaining = Math.max(0, user.quotaTotal - user.quotaUsed);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    quotaTotal: user.quotaTotal,
    quotaUsed: user.quotaUsed,
    quotaRemaining,
    assets: user.assets,
  });
}
