import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 45;

const LLM_API_KEY = process.env.LLM_TEXT_API_KEY || process.env.OPENROUTER_API_KEY || process.env.TOKENROUTER_API_KEY || '';
const LLM_BASE_URL = process.env.LLM_TEXT_BASE_URL || 'https://airouter.xincache.cn/v1';
const COPY_MODEL = process.env.COPY_MODEL || 'gpt-4o-mini';

interface CopyVariant {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  angle: string; // e.g. "Emotional", "Problem-Solution", "Social Proof"
}

interface CopywriteResult {
  brand: string;
  sellingPoints: string[];   // 提炼的3-5个核心卖点
  variants: CopyVariant[];   // 3套文案
  styleContext: string;      // 注入生图用的 style context
}

export async function POST(req: NextRequest) {
  if (!LLM_API_KEY) {
    return NextResponse.json({ error: 'LLM API key not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { title, description, brand, keywords, price, targetMarket, sourceUrl } = body;

  if (!title && !description) {
    return NextResponse.json({ error: '需要提供产品标题或描述' }, { status: 400 });
  }

  const productInfo = [
    brand ? `Brand: ${brand}` : '',
    title ? `Product: ${title}` : '',
    description ? `Description: ${description}` : '',
    keywords?.length ? `Keywords: ${keywords.join(', ')}` : '',
    price ? `Price: ${price}` : '',
    targetMarket ? `Target Market: ${targetMarket}` : '',
    sourceUrl ? `Source: ${sourceUrl}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are an expert DTC (Direct-to-Consumer) copywriter specializing in high-converting e-commerce advertising. You write punchy, authentic, benefit-driven copy that avoids hype and speaks directly to customer desires.

Your output must be valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Analyze this product and generate advertising copy in English.

PRODUCT INFO:
${productInfo}

Return a JSON object with this exact structure:
{
  "brand": "clean brand name (no domain suffix)",
  "sellingPoints": [
    "Concise selling point 1 (max 10 words)",
    "Concise selling point 2 (max 10 words)",
    "Concise selling point 3 (max 10 words)",
    "Concise selling point 4 (max 10 words)"
  ],
  "variants": [
    {
      "angle": "Benefit-First",
      "headline": "Short punchy headline (max 8 words)",
      "subheadline": "Supporting line that adds context (max 15 words)",
      "body": "2-3 sentences. Lead with the biggest benefit. Be specific, not vague. No clichés.",
      "cta": "Action-oriented CTA (3-5 words)"
    },
    {
      "angle": "Problem-Solution",
      "headline": "...",
      "subheadline": "...",
      "body": "...",
      "cta": "..."
    },
    {
      "angle": "Social Proof",
      "headline": "...",
      "subheadline": "...",
      "body": "...",
      "cta": "..."
    }
  ],
  "styleContext": "3-5 descriptive words capturing brand visual style for image generation (e.g. 'minimalist, premium, clean white')"
}

Rules:
- All text in English
- No exclamation marks overuse (max 1 per variant)
- No "revolutionary", "game-changing", "world-class" clichés
- Headlines must be concrete, not abstract
- Body copy must mention at least one specific feature or benefit
- CTA must be action verbs`;

  try {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: COPY_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(40000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[COPYWRITE] LLM error:', res.status, err.slice(0, 200));
      return NextResponse.json({ error: 'AI文案生成失败' }, { status: 502 });
    }

    const llmData = await res.json();
    const raw = llmData.choices?.[0]?.message?.content || '';

    let parsed: CopywriteResult;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('[COPYWRITE] JSON parse failed:', raw.slice(0, 300));
      return NextResponse.json({ error: '文案解析失败，请重试' }, { status: 500 });
    }

    // Validate basic structure
    if (!parsed.variants?.length || !parsed.sellingPoints?.length) {
      return NextResponse.json({ error: '生成结果格式异常，请重试' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('[COPYWRITE]', err?.message);
    return NextResponse.json({ error: '生成超时，请重试' }, { status: 500 });
  }
}
