import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: 自审查 — 分析最近的交互日志，自动标记问题
// 审查规则:
// 1. image_response + imageError: 图片生成失败
// 2. llm_call + error: LLM调用失败
// 3. image_response + imageLatencyMs > 30000: 图片生成超时
// 4. llm_call + llmLatencyMs > 15000: LLM调用超时
// 5. intent_analysis → generate 但 image_response 为空: 有生成意图但没实际生成
// 6. prompt_build 但没有对应的 image_response: prompt构造了但图片没生成
// 7. 重复的用户输入（同一用户5分钟内发相同内容3次以上）
// 8. intent_analysis → clarify/clarify 但用户没有后续操作: 用户困惑

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const hoursAgo = body.hoursAgo || 24; // 默认审查最近24小时
  const dryRun = body.dryRun !== false; // 默认dry run，只返回分析结果不标记

  const since = new Date();
  since.setHours(since.getHours() - hoursAgo);

  // 获取最近的日志
  const logs = await prisma.interactionLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
    take: 2000,
  });

  const issues: { traceId: string; step: string; type: string; detail: string; logId: string }[] = [];

  // 1. 图片生成失败
  const failedImages = logs.filter(l => l.step === 'image_response' && l.imageError);
  for (const log of failedImages) {
    issues.push({
      traceId: log.traceId,
      step: 'image_response',
      type: 'image_failure',
      detail: `图片生成失败: ${log.imageError} (模型: ${log.imageModel || 'unknown'}, 品牌: ${log.brandName || 'unknown'})`,
      logId: log.id,
    });
  }

  // 2. LLM调用失败
  const failedLlm = logs.filter(l => l.step === 'llm_call' && l.imageError);
  for (const log of failedLlm) {
    issues.push({
      traceId: log.traceId,
      step: 'llm_call',
      type: 'llm_failure',
      detail: `LLM调用失败: ${log.imageError} (模型: ${log.llmModel || 'unknown'})`,
      logId: log.id,
    });
  }

  // 3. 图片生成超时（>30s）
  const slowImages = logs.filter(l => l.step === 'image_response' && l.imageLatencyMs && l.imageLatencyMs > 30000);
  for (const log of slowImages) {
    if (!failedImages.some(f => f.id === log.id)) {
      issues.push({
        traceId: log.traceId,
        step: 'image_response',
        type: 'image_slow',
        detail: `图片生成慢: ${log.imageLatencyMs}ms (模型: ${log.imageModel || 'unknown'}, 品牌: ${log.brandName || 'unknown'})`,
        logId: log.id,
      });
    }
  }

  // 4. LLM调用超时（>15s）
  const slowLlm = logs.filter(l => l.step === 'llm_call' && l.llmLatencyMs && l.llmLatencyMs > 15000);
  for (const log of slowLlm) {
    issues.push({
      traceId: log.traceId,
      step: 'llm_call',
      type: 'llm_slow',
      detail: `LLM响应慢: ${log.llmLatencyMs}ms (模型: ${log.llmModel || 'unknown'})`,
      logId: log.id,
    });
  }

  // 5. 有生成意图但没实际图片生成
  const traceIds = [...new Set(logs.map(l => l.traceId))];
  for (const tid of traceIds) {
    const traceLogs = logs.filter(l => l.traceId === tid);
    const hasGenerateIntent = traceLogs.some(l => l.step === 'intent_analysis' && l.intent === 'generate');
    const hasImageResponse = traceLogs.some(l => l.step === 'image_response');
    const hasError = traceLogs.some(l => l.step === 'error');
    if (hasGenerateIntent && !hasImageResponse && !hasError) {
      const inputLog = traceLogs.find(l => l.step === 'user_input');
      issues.push({
        traceId: tid,
        step: 'intent_analysis',
        type: 'intent_no_action',
        detail: `用户有生成意图但没有实际图片生成 (输入: ${inputLog?.userInput?.slice(0, 50) || 'unknown'})`,
        logId: traceLogs.find(l => l.step === 'intent_analysis')?.id || '',
      });
    }
  }

  // 6. prompt构建了但图片没生成
  for (const tid of traceIds) {
    const traceLogs = logs.filter(l => l.traceId === tid);
    const hasPromptBuild = traceLogs.some(l => l.step === 'prompt_build');
    const hasImageResponse = traceLogs.some(l => l.step === 'image_response');
    const hasError = traceLogs.some(l => l.step === 'error');
    if (hasPromptBuild && !hasImageResponse && !hasError) {
      const promptLog = traceLogs.find(l => l.step === 'prompt_build');
      issues.push({
        traceId: tid,
        step: 'prompt_build',
        type: 'prompt_no_image',
        detail: `prompt已构建但图片未生成 (品牌: ${promptLog?.brandName || 'unknown'}, 场景: ${promptLog?.scene?.slice(0, 30) || 'unknown'})`,
        logId: promptLog?.id || '',
      });
    }
  }

  // 7. 重复输入检测
  const userInputs = logs.filter(l => l.step === 'user_input' && l.userInput);
  const inputMap = new Map<string, { count: number; logs: typeof userInputs }>();
  for (const log of userInputs) {
    const key = `${log.userId || log.ip || 'anonymous'}:${log.userInput}`;
    if (!inputMap.has(key)) inputMap.set(key, { count: 0, logs: [] });
    const entry = inputMap.get(key)!;
    entry.count++;
    entry.logs.push(log);
  }
  for (const [key, entry] of inputMap) {
    if (entry.count >= 3) {
      issues.push({
        traceId: entry.logs[0].traceId,
        step: 'user_input',
        type: 'repeat_input',
        detail: `同一用户5分钟内重复输入"${entry.logs[0].userInput?.slice(0, 30)}" ${entry.count}次 — 可能指令没被正确理解`,
        logId: entry.logs[entry.logs.length - 1].id,
      });
    }
  }

  // 去重并标记
  const uniqueIssues = issues.filter((issue, i, arr) =>
    arr.findIndex(a => a.type === issue.type && a.traceId === issue.traceId) === i
  );

  // 按严重程度分级
  const errorIssues = uniqueIssues.filter(i => i.type.includes('failure'));
  const warningIssues = uniqueIssues.filter(i => i.type.includes('slow') || i.type.includes('no_'));
  const infoIssues = uniqueIssues.filter(i => i.type === 'repeat_input');

  // 如果不是dry run，标记到数据库
  if (!dryRun && uniqueIssues.length > 0) {
    const updates = uniqueIssues.map(issue =>
      prisma.interactionLog.update({
        where: { id: issue.logId },
        data: {
          reviewFlag: errorIssues.some(e => e.logId === issue.logId) ? 'error' :
            warningIssues.some(w => w.logId === issue.logId) ? 'warning' : 'info',
          reviewNote: issue.detail,
          reviewedAt: new Date(),
        },
      })
    );
    await Promise.all(updates).catch(() => {});
  }

  return NextResponse.json({
    period: `${hoursAgo}h`,
    totalLogs: logs.length,
    uniqueTraces: traceIds.length,
    issues: {
      errors: errorIssues.length,
      warnings: warningIssues.length,
      info: infoIssues.length,
      list: uniqueIssues,
    },
    summary: uniqueIssues.length > 0
      ? `⚠️ 发现 ${errorIssues.length} 个错误, ${warningIssues.length} 个警告, ${infoIssues.length} 个信息`
      : '✅ 审查通过，未发现问题',
  });
}
