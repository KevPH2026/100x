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

// ─── Intent Detection ─────────────────────────────────────────────────────────

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"{}|\\^`\]]+/);
  if (m) return m[0];
  const m2 = text.match(/(?:^|[\s(])([\w-]+\.(com|cn|io|co|shop|store|ai|app|dev|net|org|xyz|me|cc|tv|design|art|co\.uk|com\.cn|com\.hk)(?:\/[^\s]*)?)(?:[\s).,;:!?]|$)/i);
  return m2 ? m2[1] : null;
}

function detectIntent(message: string): 'analyze_url' | 'generate' | 'confirm' | 'edit' | 'greet' | 'general' {
  const msg = message.trim();
  const msgLower = msg.toLowerCase();

  // URL detection — highest priority
  if (extractUrl(msg)) return 'analyze_url';

  // Greet
  if (/^(你好|hi|hello|hey|嗨|嗨|yo|sup|哈喽)[\s!！.。?？]*$/i.test(msg)) return 'greet';

  // Confirm
  if (/^(好的|确认|ok|yes|对|没错|可以|没问题|确认了|就这样|done|sure|correct|right)[\s!！.。?？]*$/i.test(msg)) return 'confirm';

  // Generate
  if (/(生成|做|来|搞|给我|来几个|搞几个|create|generate|make|produce).*(素材|图|广告|material|ad|image|creative|海报|banner)/i.test(msg)) return 'generate';
  if (/^\d+\s*张/.test(msg)) return 'generate';
  if (/(帮我|给我|来一套|全平台|各平台).*图/i.test(msg)) return 'generate';
  if (/素材|广告图|product.?shot|ad.?creative/i.test(msg)) return 'generate';

  // Edit
  if (/(不是|不对|修改|改成|换成|应该是|edit|change|fix|wrong|actually|correction)/i.test(msg)) return 'edit';

  return 'general';
}

// ─── URL Analysis ─────────────────────────────────────────────────────────────

async function analyzeUrl(url: string): Promise<BrandProfile> {
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

  // Extract meta
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
  const desc = getMeta(['og:description', 'twitter:description', 'description']);
  const keywords = getMeta(['keywords']);
  const ogImage = getMeta(['og:image', 'twitter:image']);
  const siteName = getMeta(['og:site_name', 'application-name']);

  const hostname = new URL(fetchUrl).hostname.replace(/^www\./, '');
  const brandName = siteName || title.split(/[|\-–—•·]/)[0].trim() || hostname.split('.')[0];

  // Infer industry from content
  const contentText = `${title} ${desc} ${keywords}`.toLowerCase();
  const industry = inferIndustry(contentText);
  const style = inferStyle(contentText);
  const targetAudience = inferAudience(contentText);
  const kwList = keywords.split(/[,，;；]/).map(k => k.trim()).filter(Boolean).slice(0, 8);
  const sellingPoints = extractSellingPoints(desc, contentText);

  return {
    brandName: brandName.slice(0, 50),
    website: fetchUrl,
    industry,
    style,
    keywords: kwList.length > 0 ? kwList : extractKeywords(title, desc),
    targetAudience,
    description: (desc || title).slice(0, 300),
    sellingPoints,
    logoUrl: ogImage || undefined,
  };
}

function inferIndustry(text: string): string {
  const map: [RegExp, string][] = [
    [/\b(skincare|beauty|cosmetic| makeup|serum|cream|moistur)\b/i, '美妆护肤'],
    [/\b(fashion|cloth|apparel|wear|shoe|bag|luxury|jewelry|accessor)\b/i, '时尚服饰'],
    [/\b(electronic|tech|gadget|phone|laptop|device|smart|iot)\b/i, '电子科技'],
    [/\b(food|beverage|drink|snack|coffee|tea|supplement|nutrit|health|vitamin)\b/i, '食品健康'],
    [/\b(home|furniture|decor|kitchen|garden|bedding|living)\b/i, '家居生活'],
    [/\b(sport|fitness|outdoor|gym|athletic|yoga|running|hiking)\b/i, '运动户外'],
    [/\b(pet|dog|cat|animal|kibble|treat)\b/i, '宠物用品'],
    [/\b(toy|game|kids|child|baby|maternity|parent)\b/i, '母婴玩具'],
    [/\b(car|auto|vehicle|motor|drive|tire|accessor)\b/i, '汽车用品'],
    [/\b(education|learn|course|school|tutor|book|read)\b/i, '教育文化'],
    [/\b(saaS|software|platform|tool|app|service|B2B|enterprise)\b/i, '软件服务'],
  ];
  for (const [re, label] of map) {
    if (re.test(text)) return label;
  }
  return '综合电商';
}

function inferStyle(text: string): string {
  if (/\b(luxury|premium|elegance|sophisticat|high.?end|boutique|designer)\b/i.test(text)) return '高端奢华';
  if (/\b(minimal|clean|simple|scandi|nordic|zen|bare)\b/i.test(text)) return '极简主义';
  if (/\b(vibrant|bold|colorful|fun|playful|energetic|young|pop)\b/i.test(text)) return '活力潮流';
  if (/\b(natural|organic|eco|green|sustainable|earth|raw|pure)\b/i.test(text)) return '自然有机';
  if (/\b(professional|corporate|business|formal|classic|traditional)\b/i.test(text)) return '专业经典';
  if (/\b(cute|kawaii|sweet|lovely|pastel|soft)\b/i.test(text)) return '甜美可爱';
  return '现代简约';
}

function inferAudience(text: string): string {
  if (/\b(women|woman|female|her|she|beauty|makeup)\b/i.test(text)) return '25-40岁女性';
  if (/\b(men|man|male|him|his|grooming|shave)\b/i.test(text)) return '25-40岁男性';
  if (/\b(kids|child|baby|parent|mom|maternity)\b/i.test(text)) return '年轻父母';
  if (/\b(teen|gen.?z|youth|student|young)\b/i.test(text)) return '18-25岁年轻人';
  if (/\b(senior|elder|aging|retire|50\+|mature)\b/i.test(text)) return '40岁以上';
  return '25-45岁都市消费者';
}

function extractKeywords(title: string, desc: string): string[] {
  const words = `${title} ${desc}`.split(/[\s,，.。;；:：!！?？/\\|—\-–—·•]+/);
  return words.filter(w => w.length > 2 && w.length < 20).slice(0, 6);
}

function extractSellingPoints(desc: string, fullText: string): string[] {
  const points: string[] = [];
  const sentences = (desc || fullText).split(/[.。!！?？;；\n]+/);
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length > 5 && trimmed.length < 80 && points.length < 4) {
      points.push(trimmed);
    }
  }
  return points;
}

// ─── Generate Param Parser ────────────────────────────────────────────────────

function parseGenerateParams(message: string, brand?: BrandProfile | null): {
  count: number;
  platforms: string[];
  customDesc?: string;
} {
  let count = 3;
  const numMatch = message.match(/(\d+)\s*张/);
  if (numMatch) count = Math.min(parseInt(numMatch[1]), 8);

  const platforms: string[] = [];
  const msg = message.toLowerCase();

  if (/ig|instagram|ins/.test(msg)) platforms.push('ig');
  if (/fb|facebook/.test(msg)) platforms.push('fb');
  if (/tiktok|tt|抖音/.test(msg)) platforms.push('tiktok');
  if (/pinterest|pin/.test(msg)) platforms.push('pinterest');
  if (/google|谷歌/.test(msg)) platforms.push('google');
  if (/youtube|yt|油管/.test(msg)) platforms.push('youtube');
  if (/全平台|all|全套|一套/.test(msg)) platforms.push('all');

  // Extract any custom description
  const customDesc = message.replace(/生成|做|来|搞|给我|来几个|搞几个|\d+张|素材|图|广告|ig|instagram|fb|facebook|tiktok|pinterest|google|youtube|全平台|all|全套/gi, '').trim() || undefined;

  return { count, platforms, customDesc };
}

const PLATFORM_SCENES: Record<string, { label: string; desc: string; aspectRatio: string; platform: string }[]> = {
  ig: [
    { label: 'IG Feed', desc: 'Instagram feed post, product hero shot with lifestyle feel', aspectRatio: '1:1', platform: 'IG Feed' },
    { label: 'IG Story', desc: 'Instagram story vertical format, immersive product showcase', aspectRatio: '9:16', platform: 'IG Story' },
  ],
  fb: [
    { label: 'Facebook Ad', desc: 'Facebook ad creative, scroll-stopping product shot', aspectRatio: '16:9', platform: 'Facebook' },
  ],
  tiktok: [
    { label: 'TikTok Ad', desc: 'TikTok in-feed ad, vertical format, bold visual impact', aspectRatio: '9:16', platform: 'TikTok' },
  ],
  pinterest: [
    { label: 'Pinterest Pin', desc: 'Pinterest pin, tall format, inspirational product styling', aspectRatio: '2:3', platform: 'Pinterest' },
  ],
  google: [
    { label: 'Google Ad', desc: 'Google display ad, clean product shot with clear branding', aspectRatio: '16:9', platform: 'Google Ads' },
  ],
  youtube: [
    { label: 'YouTube Thumbnail', desc: 'YouTube video thumbnail, eye-catching product reveal', aspectRatio: '16:9', platform: 'YouTube' },
  ],
};

function buildScenes(platforms: string[], count: number): { label: string; desc: string; aspectRatio: string; platform?: string }[] {
  if (platforms.includes('all') || platforms.length === 0) {
    const all: typeof PLATFORM_SCENES.ig = [];
    for (const scenes of Object.values(PLATFORM_SCENES)) all.push(...scenes);
    return all.slice(0, count || 6);
  }

  const result: typeof PLATFORM_SCENES.ig = [];
  for (const p of platforms) {
    const scenes = PLATFORM_SCENES[p];
    if (scenes) result.push(...scenes);
  }
  return result.slice(0, count || 6);
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

    const intent = detectIntent(message);
    let response: AgentResponse;

    switch (intent) {
      case 'greet': {
        if (existingBrand) {
          const assetCount = userId ? await prisma.asset.count({ where: { userId } }) : 0;
          response = {
            reply: `欢迎回来！你的品牌 **${existingBrand.brandName}** 已经准备好了${assetCount > 0 ? `，之前生成了 ${assetCount} 张素材` : ''}。\n\n今天想生成什么素材？直接告诉我平台和数量就行，比如"来3张IG Feed素材"。`,
            action: 'greet',
            brandProfile: existingBrand,
            suggestions: ['来3张IG Feed素材', '生成全平台一套', '换一个品牌网站分析'],
          };
        } else {
          response = {
            reply: '你好！我是 **100x AI素材助手** 🎨\n\n告诉我你的**品牌网站**，我来帮你快速建立品牌档案，然后一键生成广告素材。\n\n比如直接发网址：`glowskin.com`',
            action: 'greet',
            suggestions: ['分析我的品牌网站', '直接告诉我品牌名和卖点'],
          };
        }
        break;
      }

      case 'analyze_url': {
        const url = extractUrl(message)!;
        try {
          const profile = await analyzeUrl(url);
          response = {
            reply: `🔍 分析完成！我从 **${profile.brandName}** 提取了以下品牌信息：\n\n` +
              `**行业：** ${profile.industry}\n` +
              `**风格：** ${profile.style}\n` +
              `**目标人群：** ${profile.targetAudience}\n` +
              (profile.keywords?.length ? `**关键词：** ${profile.keywords.join('、')}\n` : '') +
              (profile.description ? `\n📝 ${profile.description.slice(0, 150)}...\n` : '') +
              `\n右侧是我提炼的品牌档案，看看有没有需要**调整或补充**的？确认后我就可以帮你生成素材了。`,
            action: 'brand_analyzed',
            brandProfile: profile,
            suggestions: ['确认，开始生成素材', '目标人群需要改一下', '补充：我们的核心卖点是...'],
          };
        } catch (e: any) {
          response = {
            reply: `⚠️ 无法访问 ${url}。可能原因：\n- 网站无法访问\n- 需要特殊权限\n\n你可以直接告诉我品牌名和卖点，我手动帮你建档案。`,
            action: 'ask_clarify',
            suggestions: ['品牌名叫XX，卖的是XX', '换个网址试试'],
          };
        }
        break;
      }

      case 'generate': {
        const brand = clientBrand || existingBrand;
        if (!brand?.brandName) {
          response = {
            reply: '我需要先了解你的品牌才能生成素材。告诉我你的**品牌网站**或者**品牌名+核心卖点**？',
            action: 'ask_clarify',
            suggestions: ['我的网站是 xxx.com', '品牌叫XX，核心产品是XX'],
          };
          break;
        }

        const params = parseGenerateParams(message, brand);
        const scenes = buildScenes(params.platforms, params.count);
        const sellingPoint = brand.sellingPoints?.[0] || brand.description?.slice(0, 60) || brand.brandName;

        response = {
          reply: `好的！为 **${brand.brandName}** 生成 **${scenes.length} 张**素材：\n\n` +
            scenes.map((s, i) => `${i + 1}. ${s.label}（${s.aspectRatio}）`).join('\n') +
            `\n\n正在生成中，每张约30秒...`,
          action: 'generate',
          generateParams: {
            brandName: brand.brandName,
            sellingPoint: params.customDesc || sellingPoint,
            scenes,
            referenceImage: brand.logoUrl,
            targetCountry: 'US',
            mood: brand.style === '高端奢华' ? 'luxury and refined' : 'modern and clean',
          },
        };
        break;
      }

      case 'edit': {
        const brand = clientBrand || existingBrand;
        if (brand) {
          // Parse edit intent from message
          const updatedBrand = { ...brand };
          if (/行业|industry/.test(message)) {
            const newIndustry = message.replace(/.*(?:行业|industry)[是为：:\s]*/i, '').replace(/[，。,.\s].*/, '').trim();
            if (newIndustry) updatedBrand.industry = newIndustry;
          }
          if (/风格|style/.test(message)) {
            const newStyle = message.replace(/.*(?:风格|style)[是为：:\s]*/i, '').replace(/[，。,.\s].*/, '').trim();
            if (newStyle) updatedBrand.style = newStyle;
          }
          if (/人群|audience|target/.test(message)) {
            const newAud = message.replace(/.*(?:人群|audience)[是为：:\s]*/i, '').replace(/[，。,.\s].*/, '').trim();
            if (newAud) updatedBrand.targetAudience = newAud;
          }
          if (/卖点|selling|core/.test(message)) {
            const sp = message.replace(/.*(?:卖点|selling|core)[是为：:\s]*/i, '').trim();
            if (sp) updatedBrand.sellingPoints = [sp, ...(updatedBrand.sellingPoints || [])];
          }

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
        const brand = clientBrand || existingBrand;
        // Save brand to DB
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
            ? `**${brand.brandName}** 品牌档案已保存 ✅\n\n现在告诉我你想生成什么素材？比如：\n- "来3张IG Feed素材"\n- "生成全平台一套6张"\n- "做一张Facebook广告图"`
            : '好的！你想生成什么素材？',
          action: 'brand_saved',
          suggestions: ['来3张IG Feed素材', '生成全平台一套', '做一张Facebook广告图'],
        };
        break;
      }

      default: {
        // General — try to extract brand info from free-form text
        const brand = clientBrand || existingBrand;
        if (!brand?.brandName && message.length > 3) {
          // Try to extract brand name and product info
          response = {
            reply: `收到！为了帮你生成更精准的素材，我需要了解几个信息：\n\n1. 你的**品牌网站**是什么？（我可以自动分析）\n2. 或者直接告诉我**品牌名**和**核心产品/卖点**\n3. 你的**目标市场**是哪里？（美国/欧洲/东南亚等）`,
            action: 'ask_clarify',
            suggestions: ['网站是 xxx.com', '品牌叫XX，卖的是XX'],
          };
        } else if (brand?.brandName) {
          // Treat as generate request
          response = {
            reply: `好的，我理解为你要为 **${brand.brandName}** 生成素材。想生成几张、什么平台的？`,
            action: 'ask_clarify',
            suggestions: ['3张IG Feed', '全平台一套', '来2张TikTok素材'],
          };
        } else {
          response = {
            reply: '告诉我你的品牌网站，我来帮你快速开始！比如直接发网址：`yourbrand.com`',
            action: 'ask_clarify',
            suggestions: ['我的网站是...'],
          };
        }
        break;
      }
    }

    return NextResponse.json(response);
  } catch (e: any) {
    console.error('[AGENT]', e);
    return NextResponse.json({ reply: '抱歉，出了点问题。请再试一次。', action: 'ask_clarify' });
  }
}
