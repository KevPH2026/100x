import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const LLM_API_KEY = process.env.LLM_TEXT_API_KEY || process.env.OPENROUTER_API_KEY || process.env.TOKENROUTER_API_KEY || '';
const LLM_BASE_URL = process.env.LLM_TEXT_BASE_URL || 'https://airouter.xincache.cn/v1';
const SCENE_MODEL = process.env.SCENE_MODEL || 'gpt-4o-mini';

interface SceneItem {
  label: string;       // 中文标签，如 "户外 – 城市公园"
  desc: string;        // 英文 prompt 片段（注入生图）
  aspectRatio: string; // 1:1 / 9:16 / 16:9 / 2:3 / 3:2
  platform: string;    // Instagram Feed / TikTok / Pinterest 等
}

const FALLBACK_SCENES: SceneItem[] = [
  { label: '生活方式 – 居家', desc: 'cozy home interior, soft natural light, lifestyle context', aspectRatio: '1:1', platform: 'Instagram Feed' },
  { label: '户外 – 城市', desc: 'urban outdoor scene, daylight, candid lifestyle', aspectRatio: '9:16', platform: 'Instagram Story' },
  { label: '工作室 – 极简白底', desc: 'minimalist studio shot, clean white background, soft shadows', aspectRatio: '16:9', platform: 'Facebook Banner' },
  { label: '产品 – 平铺布景', desc: 'flat lay product photography, top-down view, complementary props', aspectRatio: '3:2', platform: 'Pinterest' },
  { label: '生活方式 – 咖啡店', desc: 'cozy cafe table, morning light, warm tones', aspectRatio: '1:1', platform: 'Xiaohongshu' },
  { label: '户外 – 自然', desc: 'natural outdoor environment, golden hour, scenic backdrop', aspectRatio: '2:3', platform: 'Pinterest' },
  { label: '城市 – 夜景霓虹', desc: 'urban night scene, neon lights, cinematic mood', aspectRatio: '9:16', platform: 'TikTok' },
  { label: '极简 – 纯色背景', desc: 'minimal solid color background, studio lighting, hero shot', aspectRatio: '1:1', platform: 'Instagram Feed' },
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, brand, keywords, sellingPoint, category } = body;

  // 没填产品信息 → 直接给通用 fallback
  if (!title && !description && !sellingPoint) {
    return NextResponse.json({ scenes: FALLBACK_SCENES, source: 'fallback' });
  }

  if (!LLM_API_KEY) {
    return NextResponse.json({ scenes: FALLBACK_SCENES, source: 'no-llm' });
  }

  const productInfo = [
    brand ? `Brand: ${brand}` : '',
    title ? `Product: ${title}` : '',
    description ? `Description: ${description}` : '',
    sellingPoint ? `Key Selling Point: ${sellingPoint}` : '',
    keywords?.length ? `Keywords: ${(keywords as string[]).join(', ')}` : '',
    category ? `Category: ${category}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are a senior DTC creative director. Given a product, you propose 8 BEST advertising scene concepts that fit the product's actual use context, target audience, and aspirational lifestyle.

Rules:
- Scenes must be SPECIFIC to the product (a smart ring → hand close-up / nightclub / sleep / gym; a coffee maker → kitchen counter / morning / cozy cafe; headphones → commute / gym / desk; skincare → bathroom / vanity / outdoor).
- WEARABLE products (underwear, lingerie, swimwear, apparel, shoes, jewelry, watches, glasses, hats): the product must be shown WORN ON A HUMAN MODEL, not laid flat or floating. At least 4 of 8 scenes must feature a model wearing the product (mix close-up and full-body).
- For lingerie/underwear/swimwear: tasteful, non-explicit, brand-safe poses in commercial stock-photo style, compliant with Meta/TikTok ad policies. Examples: model wearing the underwear in a bright bedroom getting-ready scene, tastefully framed; athletic underwear on a fit model, gym-mirror selfie style.
- Non-wearable products: show the product in its real use context with hands/people interacting where natural.
- Mix scene types: 2 lifestyle-in-use, 2 hero/studio, 2 contextual environment, 2 platform-native (TikTok-style, Pinterest-style).
- Cover diverse aspect ratios across the 8 scenes: 1:1, 9:16, 16:9, 2:3, 3:2.
- Match scene to platform (Story/TikTok = 9:16, Feed/RedBook = 1:1, Banner/YouTube = 16:9, Pinterest = 2:3).
- "label" is in Chinese (zh-CN), short and evocative — format like "类型 – 具体场景" e.g. "生活方式 – 晨间咖啡".
- "desc" is the ENGLISH prompt fragment for image generation, 8-15 words, includes lighting/mood/setting (NO product description, NO brand).
- Return PURE JSON only, no markdown.`;

  const userPrompt = `Product to advertise:
${productInfo}

Output JSON:
{
  "scenes": [
    { "label": "中文标签", "desc": "english prompt fragment", "aspectRatio": "1:1", "platform": "Instagram Feed" },
    ... 8 items total
  ]
}`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);

    const r = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SCENE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('[recommend-scenes] LLM error', r.status, errText.slice(0, 300));
      return NextResponse.json({
        scenes: FALLBACK_SCENES,
        source: 'llm-error',
        debug: { status: r.status, body: errText.slice(0, 300), model: SCENE_MODEL, base: LLM_BASE_URL.replace(/\/v1$/, '/v1') },
      });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || '';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // 尝试从 markdown 里抽 JSON
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    const scenes = parsed?.scenes;
    if (!Array.isArray(scenes) || scenes.length < 4) {
      return NextResponse.json({ scenes: FALLBACK_SCENES, source: 'parse-fail' });
    }

    // 校验+裁剪到 8
    const validRatios = new Set(['1:1', '9:16', '16:9', '2:3', '3:2', '4:5', '5:4']);
    const cleaned: SceneItem[] = scenes
      .slice(0, 8)
      .map((s: any) => ({
        label: String(s.label || '').slice(0, 40) || '场景',
        desc: String(s.desc || '').slice(0, 200) || 'lifestyle scene, natural light',
        aspectRatio: validRatios.has(String(s.aspectRatio)) ? s.aspectRatio : '1:1',
        platform: String(s.platform || 'Instagram Feed').slice(0, 30),
      }));

    // 不够 8 个用 fallback 补
    while (cleaned.length < 8) {
      cleaned.push(FALLBACK_SCENES[cleaned.length]);
    }

    return NextResponse.json({ scenes: cleaned, source: 'llm' });
  } catch (e: any) {
    console.error('[recommend-scenes] exception', e?.message);
    return NextResponse.json({ scenes: FALLBACK_SCENES, source: 'exception' });
  }
}
