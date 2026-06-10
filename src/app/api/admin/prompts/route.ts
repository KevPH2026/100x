import { NextRequest, NextResponse } from 'next/server';
import { readAppConfig } from '@/lib/app-config';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 从 adforge/route.ts 提取的 prompt 模板
  const refRulesPrompt = `MISSION: Place the EXACT product from the reference image into a new scene...

ABSOLUTE RULES — VIOLATING ANY = FAILURE:
1. The product MUST be a pixel-perfect 1:1 replica of the reference image.
2. DO NOT redesign, reimagine, simplify, or improve the product.
3. Match every color hex value, every curve, every contour, every surface finish exactly.
4. Keep all logos, text, engravings, markings as-is.
5. Keep proportions and geometry identical.
6. Do not add or remove buttons, sensors, lights, features.
7. Treat the reference product as a real physical object you are photographing — only the SURROUNDING SCENE changes.`;

  const noRefPrompt = `Create a stunning product advertisement image.`;

  const fullPromptTemplate = `{refRules/noRef}
- Scene: {sceneDesc}
- Mood: {mood}
- Target market: {targetCountry}
- Style: professional product photography, magazine-grade
- Lighting: natural, soft, with realistic shadows and reflections
- Composition: product is the hero, well-positioned, with room to breathe
- Camera: Canon EOS R5, 85mm f/1.4, shallow depth of field

BRAND CONTEXT:
Brand: {brandName}
Product: {sellingPoint}
{userCtx}
{finalCheck/aspectRatio}`;

  const brandAnalysisPrompt = `You are a brand analysis expert for a DTC advertising creative platform. Analyze the website content and extract brand intelligence.

Response fields: brandName, industry, style, targetAudience, toneOfVoice, sellingPoints, keywords, competitors, priceRange, description, moodKeywords`;

  const intentDetectionPrompt = `You are analyzing user messages in a DTC ad creative platform chat. Determine the user's intent.

Intent types: generate | edit | clarify | chat | brand_info
- brand_info: user describing their brand directly
- generate: user wants to create ad images
- edit: user wants to modify brand profile
- clarify: user asking a question
- chat: general conversation`;

  const sceneBuilderPrompt = `You are an advertising creative director. Generate scene descriptions for ad image generation.

Each scene: label, desc (English, 2-3 sentences with product placement, setting, lighting, mood, composition), aspectRatio, platform`;

  const chatResponsePrompt = `You are a friendly and professional AI ad creative assistant for "100x" platform.
Help users create advertising materials. Be concise and action-oriented.
Always guide toward: share website → confirm profile → generate ads`;

  // 功能清单
  const features = [
    { module: '品牌分析', endpoint: '/api/agent (analyze_url)', description: '输入URL → LLM抓取+分析 → 提取品牌DNA', model: 'MiniMax-Text-01', status: 'active' },
    { module: '直接描述品牌', endpoint: '/api/agent (brand_info)', description: '用户口述品牌名+卖点+人群 → 建档案', model: 'MiniMax-Text-01', status: 'active' },
    { module: '意图识别', endpoint: '/api/agent (detectIntent)', description: 'LLM判断6种intent: analyze_url/generate/confirm/edit/greet/chat/brand_info', model: 'MiniMax-Text-01', status: 'active' },
    { module: '场景构建', endpoint: '/api/agent (buildScenes)', description: 'LLM根据品牌+用户需求生成2-6个广告场景描述', model: 'MiniMax-Text-01', status: 'active' },
    { module: '对话响应', endpoint: '/api/agent (chat)', description: 'LLM自然对话，引导用户走完流程', model: 'MiniMax-Text-01', status: 'active' },
    { module: '图片生成', endpoint: '/api/adforge', description: 'Novart nova-image-pro 生图，带参考图做风格注入', model: 'nova-image-pro', status: 'active' },
    { module: '再编辑', endpoint: '/api/adforge (isReEdit)', description: '用上一版生成图做参考，只换场景不换产品', model: 'nova-image-pro', status: 'active' },
    { module: '品牌DNA色板', endpoint: '/api/brand-dna', description: 'Canvas算法提取主色/互补色/类似色/中性色', model: 'server-side', status: 'active' },
    { module: '速率限制', endpoint: '/api/adforge (rateLimit)', description: '每用户每分钟3次生成', model: 'in-memory Map', status: 'active' },
    { module: '配额管理', endpoint: '/api/quota/check + consume', description: '生成不扣点，下载扣点，下载前加水印', model: 'DB counter', status: 'active' },
    { module: '免费注册', endpoint: '/api/auth/register', description: '2步收集: 邮箱密码 → 公司+姓名+电话(选填邀请码)', model: 'NextAuth v5', status: 'active' },
    { module: '邀请码', endpoint: '/api/invite', description: 'DTC10100等邀请码，多用户共享模式(maxUses/currentUses)', model: 'DB counter', status: 'active' },
    { module: '用户品牌记忆', endpoint: '/api/user/memory + /api/adforge', description: '记忆用户偏好(风格/渠道/调性)，注入生图prompt', model: 'DB UserMemory', status: 'active' },
    { module: 'Vercel Blob存储', endpoint: '/api/adforge', description: '生成图存Vercel Blob，URL持久化', model: '@vercel/blob', status: 'active' },
    { module: 'Agent对话式交互', endpoint: '/chat', description: '左侧聊天+右侧品牌面板，移动端底部sheet', model: 'React useState', status: 'active' },
    { module: '双域名路由', endpoint: '/middleware.ts', description: '100x.pics→/landing, 100pics.today→/', model: 'middleware', status: 'active' },
    { module: '中英文切换', endpoint: '/landing', description: '首页默认中文，右上角切英文', model: 'React state', status: 'active' },
    { module: 'Admin后台', endpoint: '/admin', description: '概览/用户/素材/邀请码/配置/Prompt调试', model: 'cookie auth', status: 'active' },
  ];

  // 读取当前运行时配置
  let runtimeConfig: Record<string, unknown> = {};
  try {
    runtimeConfig = await readAppConfig();
  } catch {}

  return NextResponse.json({
    prompts: {
      imageGeneration: {
        withReference: refRulesPrompt,
        withoutReference: noRefPrompt,
        fullTemplate: fullPromptTemplate,
        variables: ['sceneDesc', 'mood', 'targetCountry', 'brandName', 'sellingPoint', 'userCtx', 'isReEdit'],
      },
      brandAnalysis: brandAnalysisPrompt,
      intentDetection: intentDetectionPrompt,
      sceneBuilder: sceneBuilderPrompt,
      chatResponse: chatResponsePrompt,
    },
    features,
    runtimeConfig,
    envInfo: {
      NODE_ENV: process.env.NODE_ENV,
      hasNovartKey: !!process.env.NOVART_API_KEY,
      hasMiniMaxKey: !!process.env.MINIMAX_API_KEY,
      hasTokenRouterKey: !!process.env.TOKENROUTER_API_KEY,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    },
  });
}
