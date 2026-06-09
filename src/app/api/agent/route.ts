import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandProfile {
  brandName: string;
  website?: string;
  industry?: string;
  style?: string;
  keywords?: string[];
  colorPalette?: string[];
  targetAudience?: string;
  description?: string;
  sellingPoints?: string[];
  toneOfVoice?: string;
  competitors?: string[];
  priceRange?: string;
  logoUrl?: string;
}

interface AgentResponse {
  reply: string;
  action?: 'brand_analyzed' | 'generate' | 'brand_saved' | 'ask_clarify' | 'greet';
  brandProfile?: BrandProfile;
  generateParams?: {
    brandName: string;
    sellingPoint: string;
    scenes: { label: string; desc: string; aspectRatio: string; platform?: string }[];
    referenceImage?: string;
    targetCountry?: string;
    mood?: string;
  };
  suggestions?: string[];
}

// ─── LLM (MiniMax Text) ──────────────────────────────────────────────────────

const MINIMAX_KEY = process.env.MINIMAX_API_KEY || '';

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`LLM API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── URL Scrape ───────────────────────────────────────────────────────────────

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"{}|\\^`\]]+/);
  if (m) return m[0];
  const m2 = text.match(/(?:^|[\s(])([\w-]+\.(com|cn|io|co|shop|store|ai|app|dev|net|org|xyz|me|cc|tv|design|art|co\.uk|com\.cn|com\.hk)(?:\/[^\s]*)?)(?:[\s).,;:!?]|$)/i);
  return m2 ? m2[1] : null;
}

async function scrapeWebsite(url: string): Promise<{ title: string; description: string; keywords: string; body: string; ogImage: string }> {
  let fetchUrl = url;
  if (!/^https?:\/\//i.test(fetchUrl)) fetchUrl = 'https://' + fetchUrl;

  const res = await fetch(fetchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();

  const getMeta = (patterns: string[]): string => {
    for (const p of patterns) {
      const m = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${p}["'][^>]*content=["']([^"']+)["']`, 'i'));
      if (m) return m[1];
      const m2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${p}["']`, 'i'));
      if (m2) return m2[1];
    }
    return '';
  };

  const title = getMeta(['og:title', 'twitter:title']) || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
  const description = getMeta(['og:description', 'twitter:description', 'description']);
  const keywords = getMeta(['keywords']);
  const ogImage = getMeta(['og:image', 'twitter:image']);

  // Extract body text (strip tags, get first ~3000 chars)
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

  return { title, description, keywords, body, ogImage };
}

// ─── LLM Brand Analysis ──────────────────────────────────────────────────────

async function analyzeBrandWithLLM(url: string): Promise<BrandProfile> {
  const scraped = await scrapeWebsite(url);

  const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, '');
  const fallbackName = scraped.title.split(/[|\-–—•·]/)[0].trim() || hostname.split('.')[0];

  // Check if we have enough content for LLM analysis
  const contentForLLM = `${scraped.title}\n${scraped.description}\n${scraped.keywords}\n${scraped.body}`;
  if (contentForLLM.trim().length < 30) {
    // Fallback to basic extraction if too little content
    return {
      brandName: fallbackName.slice(0, 50),
      website: url.startsWith('http') ? url : 'https://' + url,
      description: scraped.description.slice(0, 300) || scraped.title,
      logoUrl: scraped.ogImage || undefined,
    };
  }

  const systemPrompt = `You are a brand analysis expert for a DTC (Direct-to-Consumer) advertising creative platform. Analyze the website content and extract brand intelligence.

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
}`;

  const userMessage = `Analyze this brand website:
URL: ${url}
Title: ${scraped.title}
Meta Description: ${scraped.description}
Meta Keywords: ${scraped.keywords}

Page Content:
${scraped.body.slice(0, 3000)}`;

  const llmResponse = await callLLM(systemPrompt, userMessage);

  try {
    // Clean response - remove markdown code blocks if present
    const cleaned = llmResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      brandName: (parsed.brandName || fallbackName).slice(0, 50),
      website: url.startsWith('http') ? url : 'https://' + url,
      industry: parsed.industry,
      style: parsed.style,
      targetAudience: parsed.targetAudience,
      toneOfVoice: parsed.toneOfVoice,
      sellingPoints: parsed.sellingPoints || [],
      keywords: parsed.keywords || [],
      competitors: parsed.competitors || [],
      priceRange: parsed.priceRange,
      description: parsed.description || scraped.description.slice(0, 300),
      logoUrl: scraped.ogImage || undefined,
    };
  } catch {
    // LLM output not valid JSON, return what we can
    return {
      brandName: fallbackName.slice(0, 50),
      website: url.startsWith('http') ? url : 'https://' + url,
      description: scraped.description.slice(0, 300) || scraped.title,
      logoUrl: scraped.ogImage || undefined,
    };
  }
}

// ─── LLM Intent Detection ────────────────────────────────────────────────────

async function detectIntentWithLLM(message: string, hasBrand: boolean): Promise<{
  intent: 'analyze_url' | 'generate' | 'confirm' | 'edit' | 'greet' | 'clarify' | 'chat' | 'brand_info';
  extractedUrl?: string;
  generateDetails?: { count?: number; platforms?: string[]; desc?: string };
  editFields?: Record<string, string>;
  brandInfo?: { brandName?: string; industry?: string; sellingPoints?: string[]; targetAudience?: string; description?: string };
}> {
  // Fast path: URL detection is regex-based and reliable
  const url = extractUrl(message);
  if (url) return { intent: 'analyze_url', extractedUrl: url };

  // Fast path for simple cases
  if (/^(你好|hi|hello|hey|嗨|yo|哈喽)[\s!！.。?？]*$/i.test(message.trim())) {
    return { intent: 'greet' };
  }
  if (/^(好的|确认|ok|yes|对|没错|可以|没问题|确认了|就这样|done|sure|correct|right)[\s!！.。?？]*$/i.test(message.trim())) {
    return { intent: 'confirm' };
  }

  // Use LLM for complex intent detection
  const systemPrompt = `You are analyzing user messages in a DTC ad creative platform chat. Determine the user's intent.

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
- "chat": general conversation or doesn't fit other categories.
- Has brand profile already: ${hasBrand}
- If user mentions a brand name + product/service info, use "brand_info" intent.`;

  try {
    const llmResponse = await callLLM(systemPrompt, message);
    const cleaned = llmResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback to regex-based detection
    if (/(生成|做|来|搞|给我|create|generate|make).*(素材|图|广告|material|ad|image)/i.test(message)) return { intent: 'generate', generateDetails: { count: 3 } };
    if (/(不是|不对|修改|改成|换成|edit|change|fix)/i.test(message)) return { intent: 'edit' };
    return { intent: 'chat' };
  }
}

// ─── LLM Generate Scene Builder ──────────────────────────────────────────────

async function buildScenesWithLLM(
  message: string,
  brand: BrandProfile,
): Promise<{ label: string; desc: string; aspectRatio: string; platform: string }[]> {
  const systemPrompt = `You are an advertising creative director. Generate scene descriptions for ad image generation.

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

Generate 2-6 scenes. Default to 3 if count not specified.`;

  const brandContext = `Brand: ${brand.brandName}
Industry: ${brand.industry || 'Unknown'}
Style: ${brand.style || 'Modern'}
Target Audience: ${brand.targetAudience || 'General'}
Selling Points: ${brand.sellingPoints?.join(', ') || 'N/A'}
Tone: ${brand.toneOfVoice || 'Professional'}
Mood Keywords: ${(brand as any).moodKeywords?.join(', ') || 'modern, clean'}
User Request: ${message}`;

  try {
    const llmResponse = await callLLM(systemPrompt, brandContext);
    const cleaned = llmResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const scenes = JSON.parse(cleaned);
    if (Array.isArray(scenes) && scenes.length > 0) return scenes.slice(0, 6);
  } catch { /* fallback below */ }

  // Fallback scenes
  return [
    { label: 'IG Feed', desc: `Product hero shot for ${brand.brandName}, clean background with brand-appropriate colors, professional studio lighting, modern composition`, aspectRatio: '1:1', platform: 'IG Feed' },
    { label: 'Facebook Ad', desc: `Lifestyle product showcase for ${brand.brandName}, aspirational setting, natural lighting, scroll-stopping visual`, aspectRatio: '16:9', platform: 'Facebook' },
    { label: 'IG Story', desc: `Vertical immersive product experience for ${brand.brandName}, bold visual impact, trendy aesthetic`, aspectRatio: '9:16', platform: 'IG Story' },
  ];
}

// ─── LLM Chat Response ───────────────────────────────────────────────────────

async function generateChatResponse(message: string, brand: BrandProfile | null): Promise<string> {
  const systemPrompt = `You are a friendly and professional AI ad creative assistant for "100x" platform (100x.pics). You help DTC brands create advertising materials.

Your job:
- Help users understand what you can do (analyze brand websites, generate ad creatives)
- Be concise and action-oriented
- Always guide toward the next step: share website → confirm profile → generate ads
- If user has no brand, ask for their website or brand info
- If user has brand, suggest generating ads
- Keep responses under 3 sentences unless explaining something complex
- Write in Chinese unless the user writes in English

Current brand profile: ${brand ? JSON.stringify(brand) : 'None'}`;

  return callLLM(systemPrompt, message);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, brandProfile: clientBrand, conversationState } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ reply: '请告诉我你的需求 😊', action: 'ask_clarify' });
    }

    const session = await auth();
    const userId = session?.user?.id;

    // Load existing brand if logged in
    let existingBrand: BrandProfile | null = null;
    if (userId) {
      const brands = await prisma.userBrand.findMany({ where: { userId }, orderBy: { lastUsedAt: 'desc' }, take: 1 });
      if (brands[0]) {
        existingBrand = {
          brandName: brands[0].brandName,
          industry: brands[0].industry || undefined,
          style: brands[0].style || undefined,
          targetAudience: brands[0].targetAudience || undefined,
        };
      }
    }

    const currentBrand = clientBrand || existingBrand;
    const intentResult = await detectIntentWithLLM(message, !!currentBrand?.brandName);
    let response: AgentResponse;

    switch (intentResult.intent) {
      case 'greet': {
        if (currentBrand) {
          const assetCount = userId ? await prisma.asset.count({ where: { userId } }) : 0;
          response = {
            reply: `欢迎回来！你的品牌 **${currentBrand.brandName}** 已就绪${assetCount > 0 ? `，之前生成了 ${assetCount} 张素材` : ''}。\n\n今天想生成什么素材？`,
            action: 'greet',
            brandProfile: currentBrand,
            suggestions: ['来3张IG Feed素材', '生成全平台一套', '换一个品牌网站分析'],
          };
        } else {
          response = {
            reply: '你好！我是 **100x AI素材助手** 🎨\n\n告诉我你的**品牌网站**，我来帮你分析品牌基因，然后一键生成广告素材。\n\n比如直接发网址：`glossier.com`',
            action: 'greet',
            suggestions: ['分析我的品牌网站', '直接告诉我品牌名和卖点'],
          };
        }
        break;
      }

      case 'analyze_url': {
        const url = intentResult.extractedUrl || extractUrl(message)!;
        try {
          const profile = await analyzeBrandWithLLM(url);

          const replyParts = [
            `🔍 分析完成！**${profile.brandName}** 品牌档案：`,
            ``,
            `**行业：** ${profile.industry || '待确认'}`,
            `**风格：** ${profile.style || '待确认'}`,
            `**目标人群：** ${profile.targetAudience || '待确认'}`,
          ];
          if (profile.sellingPoints?.length) {
            replyParts.push(`**核心卖点：** ${profile.sellingPoints.slice(0, 3).join(' / ')}`);
          }
          if (profile.toneOfVoice) {
            replyParts.push(`**品牌调性：** ${profile.toneOfVoice}`);
          }
          if (profile.description) {
            replyParts.push(`\n📝 ${profile.description}`);
          }
          replyParts.push(`\n右侧是我提炼的品牌档案，看看有没有需要**调整或补充**的？确认后就可以开始生成素材了。`);

          response = {
            reply: replyParts.join('\n'),
            action: 'brand_analyzed',
            brandProfile: profile,
            suggestions: ['确认，开始生成素材', '目标人群需要改一下', '补充：我们的核心卖点是...'],
          };
        } catch (e: any) {
          response = {
            reply: `⚠️ 无法访问 ${url}（${e.message}）\n\n你可以直接告诉我品牌名和卖点，我手动帮你建档案。`,
            action: 'ask_clarify',
            suggestions: ['品牌名叫XX，卖的是XX', '换个网址试试'],
          };
        }
        break;
      }

      case 'brand_info': {
        // User provided brand info directly without URL
        const info = intentResult.brandInfo;
        if (info?.brandName) {
          const profile: BrandProfile = {
            brandName: info.brandName,
            industry: info.industry || undefined,
            sellingPoints: info.sellingPoints?.filter(Boolean) || undefined,
            targetAudience: info.targetAudience || undefined,
            description: info.description || undefined,
          };
          response = {
            reply: `收到！我整理了 **${profile.brandName}** 的品牌档案：\n\n` +
              (profile.industry ? `**行业：** ${profile.industry}\n` : '') +
              (profile.targetAudience ? `**目标人群：** ${profile.targetAudience}\n` : '') +
              (profile.sellingPoints?.length ? `**核心卖点：** ${profile.sellingPoints.join(' / ')}\n` : '') +
              `\n右侧是品牌档案，有需要调整的吗？确认后就可以开始生成素材了。`,
            action: 'brand_analyzed',
            brandProfile: profile,
            suggestions: ['确认，开始生成素材', '补充一下品牌风格', '加上品牌网站'],
          };
        } else {
          response = {
            reply: '告诉我更多关于你的品牌信息：品牌名、产品、目标客户等，我来帮你建立档案。',
            action: 'ask_clarify',
          };
        }
        break;
      }

      case 'generate': {
        const brand = currentBrand;
        if (!brand?.brandName) {
          response = {
            reply: '我需要先了解你的品牌才能生成素材。告诉我你的**品牌网站**或者**品牌名+核心卖点**？',
            action: 'ask_clarify',
            suggestions: ['我的网站是 xxx.com', '品牌叫XX，核心产品是XX'],
          };
          break;
        }

        // Use LLM to build creative scenes
        const scenes = await buildScenesWithLLM(message, brand);
        const sellingPoint = brand.sellingPoints?.[0] || brand.description?.slice(0, 60) || brand.brandName;

        response = {
          reply: `好的！为 **${brand.brandName}** 生成 **${scenes.length} 张**素材：\n\n` +
            scenes.map((s, i) => `${i + 1}. ${s.label}（${s.aspectRatio}）`).join('\n') +
            `\n\n正在生成中，每张约30秒...`,
          action: 'generate',
          generateParams: {
            brandName: brand.brandName,
            sellingPoint: intentResult.generateDetails?.desc || sellingPoint,
            scenes,
            referenceImage: brand.logoUrl,
            targetCountry: 'US',
            mood: (brand as any).moodKeywords?.join(', ') || 'modern and clean',
          },
        };
        break;
      }

      case 'edit': {
        const brand = currentBrand;
        if (brand) {
          const updatedBrand = { ...brand };
          const fields = intentResult.editFields || {};
          if (fields.industry) updatedBrand.industry = fields.industry;
          if (fields.style) updatedBrand.style = fields.style;
          if (fields.targetAudience) updatedBrand.targetAudience = fields.targetAudience;
          if (fields.sellingPoint) updatedBrand.sellingPoints = [fields.sellingPoint, ...(updatedBrand.sellingPoints || [])];

          response = {
            reply: '✅ 已更新品牌档案。看看右侧信息是否正确？',
            action: 'brand_analyzed',
            brandProfile: updatedBrand,
            suggestions: ['确认，开始生成素材', '还有需要补充的'],
          };
        } else {
          response = {
            reply: '还没有品牌档案，先告诉我你的品牌信息？',
            action: 'ask_clarify',
          };
        }
        break;
      }

      case 'confirm': {
        const brand = currentBrand;
        if (userId && brand?.brandName) {
          try {
            await prisma.userBrand.upsert({
              where: { userId_brandName: { userId, brandName: brand.brandName } },
              update: {
                industry: brand.industry || undefined,
                style: brand.style || undefined,
                targetAudience: brand.targetAudience || undefined,
                notes: brand.description || undefined,
                lastUsedAt: new Date(),
              },
              create: {
                userId,
                brandName: brand.brandName,
                industry: brand.industry || undefined,
                style: brand.style || undefined,
                targetAudience: brand.targetAudience || undefined,
                notes: brand.description || undefined,
              },
            });
          } catch (e) { console.error('[AGENT] Brand save:', e); }
        }

        response = {
          reply: brand?.brandName
            ? `**${brand.brandName}** 品牌档案已保存 ✅\n\n现在告诉我你想生成什么素材？\n- "来3张IG Feed素材"\n- "生成全平台一套"\n- "做一张Facebook广告图"`
            : '好的！你想生成什么素材？',
          action: 'brand_saved',
          suggestions: ['来3张IG Feed素材', '生成全平台一套', '做一张Facebook广告图'],
        };
        break;
      }

      default: {
        // 'chat' or 'clarify' — use LLM for natural conversation
        const chatReply = await generateChatResponse(message, currentBrand);
        response = {
          reply: chatReply,
          action: currentBrand?.brandName ? 'ask_clarify' : 'ask_clarify',
          suggestions: currentBrand?.brandName
            ? ['来3张IG Feed素材', '生成全平台一套']
            : ['我的网站是 xxx.com', '品牌叫XX，卖的是XX'],
        };
        break;
      }
    }

    return NextResponse.json(response);
  } catch (e: any) {
    console.error('[AGENT]', e);
    return NextResponse.json({ reply: '抱歉，出了点问题。请再试一次。', action: 'ask_clarify' });
  }
}
