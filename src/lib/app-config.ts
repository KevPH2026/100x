/**
 * App Config - 持久化到 Postgres (兼容 Vercel serverless)
 * 所有 100x / adforge / models 配置都用这个统一接口
 */
import { prisma } from "@/lib/prisma";

const CONFIG_KEY = "global";
let _cache: AppConfig | null = null;
let _cacheTs = 0;

export type AppConfig = {
  openrouter?: {
    apiKey?: string;
    enabled?: boolean;
    visionModel?: string;
    copyModel?: string;
    visionTemp?: number;
    copyTemp?: number;
    visionMaxTokens?: number;
    copyMaxTokens?: number;
  };
  minimax?: {
    apiKey?: string;
    enabled?: boolean;
    imageModel?: string;
  };
  openai?: {
    apiKey?: string;
    baseUrl?: string;
    imageModel?: string;
  };
  image?: {
    aspectRatio?: string;
    quality?: string;
    style?: string;
  };
  prompts?: {
    visionTemplate?: string;
    copyTemplate?: string;
  };
  output?: {
    language?: string;
    variations?: number;
  };
  features?: {
    enableLogoWatermark?: boolean;
    enableAutoRetry?: boolean;
    enableMultiFormat?: boolean;
  };
  branding?: {
    brandName?: string;
    brandTagline?: string;
  };
  adforge100x?: {
    imageProvider?: "minimax" | "novart"; // 选哪家生图
    novartKey?: string;
    novartBaseUrl?: string;
    novartModel?: string;
    minimaxModel?: string;
    /** 主生成 prompt (有产品参考图) */
    promptTemplate?: string;
    /** 主生成 prompt (无参考图兜底) */
    promptTemplateNoRef?: string;
    /** 自然语言再编辑 prompt (refine 接口用) */
    refinePromptTemplate?: string;
    scenes?: Array<{
      id: string;
      label: string;
      desc: string;
      aspectRatio: string;
      platform: string;
    }>;
    /** 营销目标预设 */
    marketingGoals?: Array<{ id: string; label: string; desc: string }>;
    /** 情绪基调预设 */
    moods?: Array<{ id: string; label: string; desc: string }>;
    /** 紧迫感预设 */
    urgencies?: Array<{ id: string; label: string; desc: string }>;
  };
  agentPrompts?: {
    brandAnalysis?: string;
    intentDetection?: string;
    sceneBuilder?: string;
    chatResponse?: string;
    imageGenWithRef?: string;
    imageGenNoRef?: string;
  };
  agentRuntime?: {
    /** LLM 模型名 */
    llmModel?: string;
    /** LLM temperature */
    llmTemperature?: number;
    /** LLM max_tokens */
    llmMaxTokens?: number;
    /** LLM 请求超时 ms */
    llmTimeoutMs?: number;
    /** 生图 provider: novart | tokenrouter | auto */
    imageProvider?: 'novart' | 'tokenrouter' | 'auto';
    /** Novart 生图模型 */
    novartImageModel?: string;
    /** TokenRouter 生图模型 */
    tokenrouterImageModel?: string;
    /** 生图请求超时 ms */
    imageTimeoutMs?: number;
    /** 速率限制: 窗口 ms */
    rateLimitWindowMs?: number;
    /** 速率限制: 窗口内最大次数 */
    rateLimitMaxPerWindow?: number;
    /** 默认生成场景数 */
    defaultSceneCount?: number;
  };
  /** 权益配置 */
  quotas?: {
    /** 游客权益 */
    guest?: {
      /** 是否允许游客生成 */
      enabled?: boolean;
      /** 每日生成上限（0=不限） */
      dailyLimit?: number;
      /** 总生成上限（0=不限） */
      totalLimit?: number;
    };
    /** 注册用户默认权益（注册时自动赋予） */
    registered?: {
      /** 默认额度 */
      defaultQuota?: number;
      /** 默认有效天数（0=永久） */
      defaultValidDays?: number;
    };
  };
  /** LemonSqueezy 支付配置 */
  pricing?: {
    /** Pro月付 Variant ID */
    proMonthlyVariantId?: number;
    /** Pro年付 Variant ID */
    proYearlyVariantId?: number;
    /** Pro月付价格（展示用） */
    proMonthlyPrice?: string;
    /** Pro年付价格（展示用） */
    proYearlyPrice?: string;
  };
  updatedAt?: string;
  updatedBy?: string;
};

export async function readAppConfig(): Promise<AppConfig> {
  const now = Date.now();
  if (_cache && now - _cacheTs < 30_000) return _cache;
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: CONFIG_KEY } });
    if (!row) return {};
    _cache = (row.value as AppConfig) || {};
    _cacheTs = now;
    return _cache;
  } catch (err) {
    console.error("[app-config] read error", err);
    return _cache || {};
  }
}

export async function writeAppConfig(data: AppConfig): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value: data as any },
    create: { key: CONFIG_KEY, value: data as any },
  });
}

/** 默认 prompt 模板（产品保真版 + 营销活动驱动） */
export const DEFAULT_PROMPT_WITH_REF = [
  "Place THE EXACT SAME PRODUCT from the reference image into a new advertising scene.",
  "",
  "CRITICAL PRODUCT FIDELITY RULES (must follow strictly):",
  "- Keep the product 100% identical to the reference: same shape, same color, same material, same logo, same proportions, same details.",
  "- DO NOT redesign, restyle, or reimagine the product.",
  "- The product must be instantly recognizable as the same item.",
  "",
  "Brand: \"{{brandName}}\". Product: {{sellingPoint}}.",
  "Marketing campaign: {{campaignTheme}}.",
  "Marketing goal: {{marketingGoal}}.",
  "Mood / emotional tone: {{mood}}. Urgency level: {{urgency}}.",
  "Call to action: {{cta}}.",
  "New scene (creative freedom on background/environment/lighting): {{sceneDesc}}.",
  "Target market: {{targetCountry}} consumers — match their aesthetic preferences.",
  "{{styleContext}}",
  "{{brandDNAContext}}",
  "",
  "Output: Premium commercial advertisement photography. Product is the hero, perfectly preserved. Background, lighting, and atmosphere should embody the campaign mood. No text overlay. Sharp, professional, social-media-ready.",
].join("\n");

export const DEFAULT_PROMPT_NO_REF = [
  "Professional e-commerce advertisement for brand \"{{brandName}}\".",
  "Product: {{sellingPoint}}.",
  "Marketing campaign: {{campaignTheme}}. Goal: {{marketingGoal}}.",
  "Mood: {{mood}}. Urgency: {{urgency}}. CTA: {{cta}}.",
  "Scene: {{sceneDesc}}.",
  "Target audience: {{targetCountry}} consumers.",
  "{{styleContext}}",
  "{{brandDNAContext}}",
  "Style: Professional, modern, clean composition, natural lighting, premium commercial photography. Product is the hero. Aspirational but authentic. No text overlay. High resolution.",
].join("\n");

/** 自然语言再编辑模板 — 给 refine 接口用（强化产品保真） */
export const DEFAULT_REFINE_PROMPT = [
  "Edit this advertisement image. Apply the following change while keeping everything else intact:",
  "\"{{userInstruction}}\"",
  "",
  "CRITICAL: The original product must remain EXACTLY the same — same shape, color, material, size, position, and details.",
  "DO NOT replace, remove, or redesign the product. Only change the specific element requested.",
  "Keep the original composition, layout, and product placement unless the instruction explicitly says to change them.",
  "Apply ONLY the requested change. Output a high-quality social-media-ready ad image.",
  "{{brandDNAContext}}",
].join("\n");

export const DEFAULT_SCENES = [
  { id: "lifestyle-cafe", label: "生活方式 - 咖啡店", desc: "Cozy cafe interior, morning light, warm wood tones", aspectRatio: "1:1", platform: "Instagram Feed" },
  { id: "outdoor-park", label: "户外 - 城市公园", desc: "Urban park bench, golden hour, soft bokeh background", aspectRatio: "9:16", platform: "Instagram Story" },
  { id: "studio-clean", label: "工作室 - 极简白底", desc: "Clean white studio backdrop, soft diffused lighting, minimal shadows", aspectRatio: "16:9", platform: "Facebook Banner" },
  { id: "lifestyle-home", label: "生活方式 - 居家", desc: "Modern living room, natural light through window, lifestyle setting", aspectRatio: "1:1", platform: "Xiaohongshu" },
  { id: "outdoor-beach", label: "户外 - 海滩", desc: "Beach with soft sand and ocean waves, sunset golden hour", aspectRatio: "2:3", platform: "Pinterest" },
  { id: "urban-night", label: "城市 - 夜景霓虹", desc: "Night cityscape with neon lights, modern futuristic vibe", aspectRatio: "9:16", platform: "TikTok" },
  { id: "nature-forest", label: "自然 - 森林", desc: "Lush forest with dappled sunlight, fresh organic atmosphere", aspectRatio: "16:9", platform: "YouTube Thumbnail" },
  { id: "minimal-flatlay", label: "极简 - 平铺布景", desc: "Top-down flatlay on textured surface, curated minimal props", aspectRatio: "3:2", platform: "Blog Hero" },
];

/** 营销目标预设 */
export const DEFAULT_MARKETING_GOALS = [
  { id: "awareness", label: "品牌曝光", desc: "Build brand awareness, introduce the product" },
  { id: "promo", label: "促销转化", desc: "Drive sales through discount or limited-time offer" },
  { id: "launch", label: "新品发布", desc: "Generate excitement for a new product launch" },
  { id: "retention", label: "复购召回", desc: "Re-engage existing customers, encourage repurchase" },
  { id: "ugc", label: "用户口碑", desc: "Encourage user-generated content and testimonials" },
];

/** 情绪基调预设 */
export const DEFAULT_MOODS = [
  { id: "energetic", label: "活力 / 兴奋", desc: "Energetic, exciting, vibrant, dynamic" },
  { id: "calm", label: "平静 / 治愈", desc: "Calm, serene, soothing, peaceful" },
  { id: "luxe", label: "高级 / 精致", desc: "Luxurious, premium, refined, sophisticated" },
  { id: "warm", label: "温暖 / 治愈", desc: "Warm, cozy, intimate, friendly" },
  { id: "bold", label: "大胆 / 张扬", desc: "Bold, daring, edgy, attention-grabbing" },
  { id: "minimal", label: "极简 / 干净", desc: "Minimal, clean, modern, uncluttered" },
];

/** 紧迫感预设 */
export const DEFAULT_URGENCIES = [
  { id: "none", label: "无紧迫感", desc: "No urgency, evergreen messaging" },
  { id: "low", label: "轻度", desc: "Subtle scarcity, gentle prompt" },
  { id: "high", label: "强烈", desc: "Strong urgency, limited time, act now" },
];

/** 渲染 prompt 模板（替换变量） */
export function renderPrompt(
  template: string,
  vars: {
    brandName?: string;
    sellingPoint?: string;
    sceneDesc?: string;
    targetCountry?: string;
    styleContext?: string;
    campaignTheme?: string;
    marketingGoal?: string;
    mood?: string;
    urgency?: string;
    cta?: string;
    brandDNA?: any;
    userInstruction?: string;
  }
): string {
  // 构造 brand DNA 上下文（用于注入色板、风格等）
  let brandDNAContext = "";
  if (vars.brandDNA) {
    const parts: string[] = [];
    const colors = vars.brandDNA.colors;
    if (colors?.palette?.length) {
      parts.push(`Brand color palette: ${colors.palette.slice(0, 5).join(", ")}`);
    }
    const style = vars.brandDNA.style;
    if (style?.aesthetic) parts.push(`Aesthetic: ${style.aesthetic}`);
    if (style?.mood) parts.push(`Brand mood: ${style.mood}`);
    if (style?.tone) parts.push(`Tone: ${style.tone}`);
    if (style?.photography) parts.push(`Photography style: ${style.photography}`);
    if (style?.typography) parts.push(`Typography: ${style.typography}`);
    if (parts.length) brandDNAContext = `Brand DNA — ${parts.join(". ")}.`;
  }

  return template
    .replace(/\{\{brandName\}\}/g, vars.brandName || "")
    .replace(/\{\{sellingPoint\}\}/g, vars.sellingPoint || "")
    .replace(/\{\{sceneDesc\}\}/g, vars.sceneDesc || "")
    .replace(/\{\{targetCountry\}\}/g, vars.targetCountry || "")
    .replace(/\{\{styleContext\}\}/g, vars.styleContext ? `Brand visual context: ${vars.styleContext}.` : "")
    .replace(/\{\{campaignTheme\}\}/g, vars.campaignTheme || "general brand promotion")
    .replace(/\{\{marketingGoal\}\}/g, vars.marketingGoal || "build brand awareness")
    .replace(/\{\{mood\}\}/g, vars.mood || "modern, professional")
    .replace(/\{\{urgency\}\}/g, vars.urgency || "no urgency")
    .replace(/\{\{cta\}\}/g, vars.cta || "Shop now")
    .replace(/\{\{brandDNAContext\}\}/g, brandDNAContext)
    .replace(/\{\{userInstruction\}\}/g, vars.userInstruction || "");
}
