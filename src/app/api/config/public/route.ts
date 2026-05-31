import { NextResponse } from 'next/server';
import {
  readAppConfig,
  DEFAULT_SCENES,
  DEFAULT_MARKETING_GOALS,
  DEFAULT_MOODS,
  DEFAULT_URGENCIES,
} from '@/lib/app-config';

/**
 * 公开配置（前端用） — 只暴露场景、营销目标、情绪、紧迫感等显示用预设
 * 绝不暴露 API key 或敏感字段
 */
export async function GET() {
  const config = await readAppConfig();
  const ax = config.adforge100x || {};

  return NextResponse.json({
    scenes: (ax.scenes && ax.scenes.length > 0) ? ax.scenes : DEFAULT_SCENES,
    marketingGoals: (ax.marketingGoals && ax.marketingGoals.length > 0) ? ax.marketingGoals : DEFAULT_MARKETING_GOALS,
    moods: (ax.moods && ax.moods.length > 0) ? ax.moods : DEFAULT_MOODS,
    urgencies: (ax.urgencies && ax.urgencies.length > 0) ? ax.urgencies : DEFAULT_URGENCIES,
  });
}
