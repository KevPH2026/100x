import { NextRequest, NextResponse } from 'next/server';
import { readAppConfig, writeAppConfig } from '@/lib/app-config';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === ADMIN_PASSWORD;
}

// ─── Default prompts (must match agent/route.ts DEFAULT_PROMPTS) ──────────
const DEFAULT_PROMPTS = {
  brandAnalysis: `You are a brand analysis expert for a DTC (Direct-to-Consumer) advertising creative platform. Analyze the website content and extract brand intelligence.

You MUST respond with valid JSON only, no markdown, no explanation, just the JSON object with these fields:
{
  "brandName": "Brand name (short, clean)",
  "industry": "One of: 美妆护肤/时尚服饰/电子科技/食品健康/家居生活/运动户外/宠物用品/母婴玩具/汽车用品/教育文化/软件服务/综合电商",
  "style": "One of: 高端奢华/极简主义/活力潮流/自然有机/专业经典/甜美可爱/现代简约",
  "targetAudience": "Target audience description (Chinese, e.g. 25-40岁都市女性)",
  "toneOfVoice": "Brand tone of voice (Chinese, e.g. 温柔亲切/专业权威/年轻活泼)",
  "sellingPoints": ["Top 3-5 selling points or value propositions (Chinese)"],
  "keywords": ["5-8 brand/product keywords"],
  "competitors": ["2-3 competitor brand names"],
  "priceRange": "Price positioning: 高端/中高端/中端/性价比",
  "description": "One sentence brand summary (Chinese, max 100 chars)",
  "moodKeywords": ["3-5 visual mood keywords for ad generation (English, e.g. 'clean', 'minimalist', 'warm')"]
}`,

  intentDetection: `You are analyzing user messages in a DTC ad creative platform chat. Determine the user's intent.

Respond with JSON only:
{
  "intent": "generate" | "edit" | "clarify" | "chat" | "brand_info",
  "generateDetails": { "count": number, "platforms": ["ig"|"fb"|"tiktok"|"pinterest"|"google"|"youtube"|"all"], "desc": "custom description or null" },
  "editFields": { "industry": "new value" or null, "style": "new value" or null, "targetAudience": "new value" or null, "sellingPoint": "new value or null" },
  "brandInfo": { "brandName": "string or null", "industry": "string or null", "sellingPoints": ["array of strings or empty"], "targetAudience": "string or null", "description": "string or null" }
}

Rules:
- "brand_info": user is describing their brand directly (name, product, target audience). Extract all brand fields.
- "generate": user wants to create ad images. Extract count, platforms, any custom description.
- "edit": user wants to modify brand profile. Extract which fields to change.
- "clarify": user is asking a question or needs more info.
- "chat": general conversation or doesn't fit other categories.`,

  sceneBuilder: `You are an advertising creative director. Generate scene descriptions for ad image generation.

Given a brand and user request, create specific scene descriptions. Each scene should be a vivid, detailed visual description suitable for AI image generation.

Respond with JSON array only:
[
  {
    "label": "Short label like 'IG Feed' or 'Facebook Ad'",
    "desc": "Detailed visual scene description in English (2-3 sentences). Include: product placement, setting/background, lighting, mood, composition. Be specific about colors, textures, and visual elements that match the brand style.",
    "aspectRatio": "One of: 1:1, 16:9, 9:16, 2:3, 3:2",
    "platform": "Platform name: IG Feed, IG Story, Facebook, TikTok, Pinterest, Google Ads, YouTube"
  }
]

Generate 2-6 scenes. Default to 3 if count not specified.`,

  chatResponse: `You are a friendly and professional AI ad creative assistant for "100x" platform (100x.pics). You help DTC brands create advertising materials.

Your job:
- Help users understand what you can do (analyze brand websites, generate ad creatives)
- Be concise and action-oriented
- Always guide toward the next step: share website → confirm profile → generate ads
- If user has no brand, ask for their website or brand info
- If user has brand, suggest generating ads
- Keep responses under 3 sentences unless explaining something complex
- Write in Chinese unless the user writes in English`,

  imageGenWithRef: `MISSION: Place the EXACT product from the reference image into a new scene.

ABSOLUTE RULES — VIOLATING ANY = FAILURE:
1. The product MUST be a pixel-perfect 1:1 replica of the reference image.
2. DO NOT redesign, reimagine, simplify, or improve the product.
3. Match every color hex value, every curve, every contour, every surface finish exactly.
4. Keep all logos, text, engravings, markings as-is.
5. Keep proportions and geometry identical.
6. Do not add or remove buttons, sensors, lights, features.
7. Treat the reference product as a real physical object you are photographing — only the SURROUNDING SCENE changes.`,

  imageGenNoRef: `Create a stunning product advertisement image.`,
};

// Workflow pipeline definition
const WORKFLOW = [
  { id: 'greet', label: '欢迎 / 问候', desc: '用户首次进入或打招呼', type: 'code', model: '规则匹配', next: ['analyze_url', 'brand_info', 'chat'] },
  { id: 'analyze_url', label: '品牌分析（URL）', desc: '用户输入网站URL → 抓取网页 → LLM提取品牌DNA', type: 'prompt', promptKey: 'brandAnalysis', model: 'MiniMax-Text-01', next: ['confirm'] },
  { id: 'brand_info', label: '品牌描述（口述）', desc: '用户直接描述品牌名+卖点+人群', type: 'prompt', promptKey: 'intentDetection', model: 'MiniMax-Text-01', next: ['confirm'] },
  { id: 'intent_detection', label: '意图识别', desc: 'LLM分析用户消息判断意图（6种）', type: 'prompt', promptKey: 'intentDetection', model: 'MiniMax-Text-01', next: ['generate', 'edit', 'chat'] },
  { id: 'generate', label: '场景构建 + 生图', desc: 'LLM生成场景描述 → Novart生图', type: 'prompt', promptKey: 'sceneBuilder', model: 'MiniMax-Text-01 + nova-image-pro', next: [] },
  { id: 'confirm', label: '确认品牌', desc: '用户确认品牌档案 → 保存到DB', type: 'code', model: 'DB upsert', next: ['generate'] },
  { id: 'edit', label: '编辑品牌', desc: '用户修改品牌档案字段', type: 'prompt', promptKey: 'intentDetection', model: 'MiniMax-Text-01', next: ['confirm'] },
  { id: 'chat', label: '自由对话', desc: '闲聊/咨询/引导', type: 'prompt', promptKey: 'chatResponse', model: 'MiniMax-Text-01', next: ['generate', 'analyze_url', 'brand_info'] },
];

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const config = await readAppConfig();
  const saved = config.agentPrompts || {};

  // Build response with both default and current (saved) values
  const prompts: Record<string, { label: string; desc: string; default: string; current: string; model: string; variables: string[]; customized: boolean }> = {
    brandAnalysis: {
      label: '品牌分析',
      desc: '输入URL → 抓取网页 → LLM提取品牌DNA（行业/风格/人群/卖点等）',
      default: DEFAULT_PROMPTS.brandAnalysis,
      current: saved.brandAnalysis || DEFAULT_PROMPTS.brandAnalysis,
      model: 'MiniMax-Text-01',
      variables: ['URL内容', 'title', 'description', 'body'],
      customized: !!saved.brandAnalysis,
    },
    intentDetection: {
      label: '意图识别',
      desc: '分析用户消息，判断意图类型：generate/edit/brand_info/clarify/chat',
      default: DEFAULT_PROMPTS.intentDetection,
      current: saved.intentDetection || DEFAULT_PROMPTS.intentDetection,
      model: 'MiniMax-Text-01',
      variables: ['message', 'hasBrand'],
      customized: !!saved.intentDetection,
    },
    sceneBuilder: {
      label: '场景构建',
      desc: '根据品牌信息+用户需求，生成2-6个广告场景描述（label/desc/aspectRatio/platform）',
      default: DEFAULT_PROMPTS.sceneBuilder,
      current: saved.sceneBuilder || DEFAULT_PROMPTS.sceneBuilder,
      model: 'MiniMax-Text-01',
      variables: ['brandName', 'industry', 'style', 'targetAudience', 'sellingPoints', 'moodKeywords', 'message'],
      customized: !!saved.sceneBuilder,
    },
    chatResponse: {
      label: '对话响应',
      desc: '闲聊/咨询场景下的自然对话回复，引导用户走完品牌建档→生图流程',
      default: DEFAULT_PROMPTS.chatResponse,
      current: saved.chatResponse || DEFAULT_PROMPTS.chatResponse,
      model: 'MiniMax-Text-01',
      variables: ['brand profile JSON'],
      customized: !!saved.chatResponse,
    },
    imageGenWithRef: {
      label: '生图（有参考图）',
      desc: '用户上传了产品参考图时的生图prompt，强调产品保真',
      default: DEFAULT_PROMPTS.imageGenWithRef,
      current: saved.imageGenWithRef || DEFAULT_PROMPTS.imageGenWithRef,
      model: 'Novart nova-image-pro',
      variables: ['referenceImage', 'sceneDesc', 'brandName', 'mood'],
      customized: !!saved.imageGenWithRef,
    },
    imageGenNoRef: {
      label: '生图（无参考图）',
      desc: '无参考图时的兜底生图prompt',
      default: DEFAULT_PROMPTS.imageGenNoRef,
      current: saved.imageGenNoRef || DEFAULT_PROMPTS.imageGenNoRef,
      model: 'Novart nova-image-pro',
      variables: ['sceneDesc', 'brandName', 'mood'],
      customized: !!saved.imageGenNoRef,
    },
  };

  return NextResponse.json({ workflow: WORKFLOW, prompts });
}

export async function PUT(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await req.json();
    // body: { agentPrompts: { brandAnalysis: "...", ... } }
    const newPrompts = body.agentPrompts;
    if (!newPrompts || typeof newPrompts !== 'object') {
      return NextResponse.json({ error: '无效数据' }, { status: 400 });
    }

    // Validate — only allow known keys
    const allowedKeys = ['brandAnalysis', 'intentDetection', 'sceneBuilder', 'chatResponse', 'imageGenWithRef', 'imageGenNoRef'];
    const filtered: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (typeof newPrompts[key] === 'string' && newPrompts[key].trim()) {
        filtered[key] = newPrompts[key].trim();
      }
    }

    const config = await readAppConfig();
    config.agentPrompts = filtered;
    config.updatedAt = new Date().toISOString();
    config.updatedBy = 'admin';
    await writeAppConfig(config);

    return NextResponse.json({ ok: true, saved: Object.keys(filtered) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // Reset all prompts to defaults
  const config = await readAppConfig();
  delete config.agentPrompts;
  config.updatedAt = new Date().toISOString();
  config.updatedBy = 'admin';
  await writeAppConfig(config);

  return NextResponse.json({ ok: true, reset: true });
}
