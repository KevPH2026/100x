import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/user/insights — 自动分析用户行为，生成AI洞察 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const userId = session.user.id;

  // 聚合分析
  const [assets, brands, memories] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { platform: true, sceneLabel: true, brandName: true, aspectRatio: true, createdAt: true },
    }),
    prisma.userBrand.findMany({ where: { userId } }),
    prisma.userMemory.findMany({ where: { userId } }),
  ]);

  // ── 行为分析 ──────────────────────────────────────────
  const insights: Array<{ type: string; label: string; value: string; confidence: number }> = [];

  // 1. 最常用平台
  const platformCounts: Record<string, number> = {};
  assets.forEach(a => { platformCounts[a.platform] = (platformCounts[a.platform] || 0) + 1; });
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];
  if (topPlatform) {
    insights.push({ type: 'pattern', label: '最常用平台', value: `${topPlatform[0]}（${topPlatform[1]}次）`, confidence: Math.min(topPlatform[1] / 5, 1) });
  }

  // 2. 最常用场景
  const sceneCounts: Record<string, number> = {};
  assets.forEach(a => { sceneCounts[a.sceneLabel] = (sceneCounts[a.sceneLabel] || 0) + 1; });
  const topScene = Object.entries(sceneCounts).sort((a, b) => b[1] - a[1])[0];
  if (topScene) {
    insights.push({ type: 'pattern', label: '偏好场景', value: `${topScene[0]}（${topScene[1]}次）`, confidence: Math.min(topScene[1] / 5, 1) });
  }

  // 3. 最常用品牌
  const brandCounts: Record<string, number> = {};
  assets.forEach(a => { brandCounts[a.brandName] = (brandCounts[a.brandName] || 0) + 1; });
  const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0];
  if (topBrand) {
    insights.push({ type: 'pattern', label: '主力品牌', value: `${topBrand[0]}（${topBrand[1]}张素材）`, confidence: Math.min(topBrand[1] / 3, 1) });
  }

  // 4. 宽高比偏好
  const ratioCounts: Record<string, number> = {};
  assets.forEach(a => { ratioCounts[a.aspectRatio] = (ratioCounts[a.aspectRatio] || 0) + 1; });
  const topRatio = Object.entries(ratioCounts).sort((a, b) => b[1] - a[1])[0];
  if (topRatio) {
    const ratioLabel: Record<string, string> = { '1:1': '方形(IG Feed)', '9:16': '竖版(Story/TikTok)', '16:9': '横版(FB/YouTube)', '2:3': '竖版(Pinterest)', '3:2': '横版' };
    insights.push({ type: 'pattern', label: '偏好尺寸', value: `${ratioLabel[topRatio[0]] || topRatio[0]}（${topRatio[1]}次）`, confidence: Math.min(topRatio[1] / 5, 1) });
  }

  // 5. 活跃度
  const lastWeek = assets.filter(a => Date.now() - new Date(a.createdAt).getTime() < 7 * 86400000).length;
  insights.push({ type: 'insight', label: '本周活跃', value: `${lastWeek}张素材`, confidence: 1 });

  // 6. 覆盖率建议
  const uniquePlatforms = new Set(assets.map(a => a.platform)).size;
  const totalPlatforms = 6;
  if (uniquePlatforms < 3 && assets.length > 5) {
    insights.push({ type: 'suggestion', label: '平台覆盖建议', value: `目前覆盖${uniquePlatforms}/${totalPlatforms}个平台，建议拓展更多投放渠道`, confidence: 0.7 });
  }

  // 7. 品牌丰富度
  const uniqueBrands = new Set(assets.map(a => a.brandName)).size;
  insights.push({ type: 'insight', label: '品牌丰富度', value: `${uniqueBrands}个品牌`, confidence: 1 });

  // 8. 素材生成趋势
  if (assets.length >= 5) {
    const recent5 = assets.slice(0, 5);
    const avgInterval = (new Date(recent5[0].createdAt).getTime() - new Date(recent5[4].createdAt).getTime()) / 4;
    const daysBetween = Math.round(avgInterval / 86400000);
    insights.push({ type: 'pattern', label: '生成节奏', value: daysBetween <= 0 ? '集中爆发' : `平均${daysBetween}天/次`, confidence: 0.8 });
  }

  return NextResponse.json({
    insights,
    stats: {
      totalAssets: assets.length,
      totalBrands: brands.length,
      totalMemories: memories.length,
      platformDistribution: platformCounts,
      sceneDistribution: sceneCounts,
    },
  });
}
