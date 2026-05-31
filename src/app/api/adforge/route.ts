import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { readAppConfig, DEFAULT_SCENES } from '@/lib/app-config';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ENV_TR_KEY = process.env.TOKENROUTER_API_KEY || '';
const ENV_TR_BASE = (process.env.TOKENROUTER_BASE_URL || 'https://api.tokenrouter.com/v1').trim();
const ENV_NOVART_KEY = process.env.NOVART_API_KEY || '';
const ENV_NOVART_BASE = (process.env.NOVART_BASE_URL || 'https://www.novartspace.art').trim();

const TR_SIZE_MAP: Record<string, string> = {
  '1:1': '1024x1024', '16:9': '1792x1024', '9:16': '1024x1792',
  '3:2': '1536x1024', '2:3': '1024x1536', '4:3': '1024x1024', '3:4': '1024x1024',
};
const NOVART_RATIO_MAP: Record<string, string> = {
  '1:1': '1:1', '16:9': '16:9', '9:16': '9:16',
  '3:2': '3:2', '2:3': '2:3', '4:3': 'auto', '3:4': 'auto',
};

function platformLabel(ratio: string, fb?: string) {
  if (fb) return fb;
  const m: Record<string, string> = {
    '1:1': 'IG Feed (1:1)', '16:9': 'FB / Google (16:9)', '9:16': 'Story / TikTok (9:16)',
    '4:3': 'Pinterest (4:3)', '2:3': 'Pinterest (2:3)', '3:2': 'Landscape (3:2)',
  };
  return m[ratio] || ratio;
}

/** TokenRouter gpt-5.4-image-2: /images/generations with image_url ref field. */
async function genTokenRouter(
  apiKey: string, baseUrl: string, prompt: string, size: string, refUrl: string,
): Promise<{ buf: Buffer | null; err?: string }> {
  const base = baseUrl.replace(/\/$/, '').trim();
  const T0 = Date.now();
  try {
    const body: Record<string, unknown> = {
      model: 'openai/gpt-5.4-image-2',
      prompt,
      size,
      n: 1,
    };
    if (refUrl) body.image_url = refUrl;
    console.log(`[TR T+${Date.now()-T0}ms] calling /images/generations...`);
    const res = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });
    console.log(`[TR T+${Date.now()-T0}ms] resp: ${res.status}`);
    if (!res.ok) {
      const t = await res.text();
      return { buf: null, err: `tr ${res.status}: ${t.slice(0, 200)}` };
    }
    const data = await res.json();
    if (Array.isArray(data?.data)) {
      for (const im of data.data) {
        if (im?.b64_json) return { buf: Buffer.from(im.b64_json, 'base64') };
        if (im?.url) {
          const r = await fetch(im.url, { signal: AbortSignal.timeout(8000) });
          if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()) };
        }
      }
    }
    return { buf: null, err: `unparsed: ${JSON.stringify(data).slice(0, 300)}` };
  } catch (e: any) {
    return { buf: null, err: `exc: ${e?.message}` };
  }
}

async function downloadToBuffer(url: string): Promise<{ buf: Buffer | null; err?: string }> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { buf: null, err: `dl ${r.status}` };
    return { buf: Buffer.from(await r.arrayBuffer()) };
  } catch (e: any) { return { buf: null, err: `dl exc ${e?.message}` }; }
}

/** Novart Vertex fallback (slow, ~50s). */
async function genNovartVertex(
  apiKey: string, baseUrl: string, prompt: string, ratio: string, refUrl: string | undefined,
): Promise<{ buf: Buffer | null; err?: string }> {
  const base = baseUrl.replace(/\/$/, '').trim();
  const T0 = Date.now();
  try {
    const parts: Record<string, unknown>[] = [{ text: prompt }];
    if (refUrl) {
      const dl = await fetch(refUrl, { signal: AbortSignal.timeout(8000) });
      if (!dl.ok) return { buf: null, err: `ref dl ${dl.status}` };
      const refBuf = Buffer.from(await dl.arrayBuffer());
      const mime = dl.headers.get('content-type') || 'image/png';
      parts.push({ inlineData: { mimeType: mime, data: refBuf.toString('base64') } });
    }
    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: ratio } },
    };
    console.log(`[NV T+${Date.now()-T0}ms] calling...`);
    const r = await fetch(`${base}/v1beta/models/nova-image-pro:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(50000),
    });
    console.log(`[NV T+${Date.now()-T0}ms] resp: ${r.status}`);
    if (!r.ok) return { buf: null, err: `nv ${r.status}` };
    const data = await r.json();
    for (const cand of data?.candidates || []) {
      for (const p of cand?.content?.parts || []) {
        if (p.inlineData?.data) return { buf: Buffer.from(p.inlineData.data, 'base64') };
        if (p.fileData?.fileUri) {
          const f = await fetch(p.fileData.fileUri, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(8000) });
          if (f.ok) return { buf: Buffer.from(await f.arrayBuffer()) };
        }
      }
    }
    return { buf: null, err: 'no img' };
  } catch (e: any) { return { buf: null, err: `nv exc ${e?.message}` }; }
}

export async function POST(req: NextRequest) {
  const config = await readAppConfig();
  const ax = config.adforge100x || {};
  const trKey = (ax as any).tokenrouterKey || ENV_TR_KEY;
  const trBase = ((ax as any).tokenrouterBaseUrl || ENV_TR_BASE).trim();
  const novartKey = ax.novartKey || ENV_NOVART_KEY;
  const novartBase = (ax.novartBaseUrl || ENV_NOVART_BASE).trim();

  if (!trKey && !novartKey) return NextResponse.json({ error: '未配置图片 API key' }, { status: 400 });

  const body = await req.json();
  const { brandName, sellingPoint, targetCountry, sceneIndex, referenceImage,
    campaignTheme, marketingGoal, mood, urgency, cta } = body;

  if (!brandName || !sellingPoint) return NextResponse.json({ error: '品牌名和卖点必填' }, { status: 400 });

  const scenes = (ax.scenes && ax.scenes.length > 0) ? ax.scenes : DEFAULT_SCENES;
  const sceneIdx = sceneIndex ?? 0;
  if (sceneIdx < 0 || sceneIdx >= scenes.length) return NextResponse.json({ error: '无效场景索引' }, { status: 400 });
  const scene = scenes[sceneIdx];
  const ratio = scene.aspectRatio || '1:1';

  const hasRef = !!referenceImage;
  const refRules = hasRef
    ? `MISSION: Place the EXACT product from the reference image into a new scene. This is product photography compositing, NOT product redesign.

ABSOLUTE RULES — VIOLATING ANY = FAILURE:
1. The product MUST be a pixel-perfect 1:1 replica of the reference image.
2. DO NOT redesign, reimagine, simplify, or improve the product.
3. Match every color hex value, every curve, every contour, every surface finish exactly.
4. Keep all logos, text, engravings, markings as-is.
5. Keep proportions and geometry identical.
6. Do not add or remove buttons, sensors, lights, features.
7. Treat the reference product as a real physical object you are photographing — only the SURROUNDING SCENE changes.

WHAT TO CHANGE (the ONLY thing you change):`
    : `Create a stunning product advertisement image.`;

  const prompt = `${refRules}
- Scene: ${scene.desc || 'elegant lifestyle setting'}
- Mood: ${mood || 'premium and refined'}
- Target market: ${targetCountry || 'US'}
- Style: professional product photography, magazine-grade
- Lighting: natural, soft, with realistic shadows and reflections
- Composition: product is the hero, well-positioned, with room to breathe
- Camera: Canon EOS R5, 85mm f/1.4, shallow depth of field

BRAND CONTEXT:
Brand: ${brandName}
Product: ${sellingPoint}
${campaignTheme ? `Campaign: ${campaignTheme}` : ''}
${marketingGoal ? `Goal: ${marketingGoal}` : ''}
${urgency && urgency !== 'none' ? `Urgency: ${urgency}` : ''}
${cta ? `CTA hint: ${cta}` : ''}

${hasRef ? 'FINAL CHECK: Is the product in my output IDENTICAL to the reference, pixel by pixel? If not, START OVER.' : `Aspect ratio: ${ratio}. Product must be the hero, well-composed, ready for social media.`}`;

  console.log(`[ADFORGE] scene=${sceneIdx} ratio=${ratio} provider-pref=${trKey ? 'tokenrouter' : 'novart'}`);
  const t0 = Date.now();

  let result: { buf: Buffer | null; err?: string } = { buf: null, err: 'no provider' };
  let providerUsed = '';

  // Novart 优先（更快，~30s），TokenRouter 备用（~50s）
  if (novartKey) {
    const nvRatio = NOVART_RATIO_MAP[ratio] || '1:1';
    result = await genNovartVertex(novartKey, novartBase, prompt, nvRatio, referenceImage);
    providerUsed = 'novart-vertex';
    if (!result.buf) console.error('[NV fail]', result.err);
  }
  if (!result.buf && trKey) {
    const size = TR_SIZE_MAP[ratio] || '1024x1024';
    result = await genTokenRouter(trKey, trBase, prompt, size, referenceImage);
    providerUsed = 'tokenrouter-image2';
    if (!result.buf) console.error('[TR fail]', result.err);
  }

  if (!result.buf) {
    return NextResponse.json({ error: `生成失败: ${result.err || 'unknown'}`, provider: providerUsed }, { status: 500 });
  }
  console.log(`[ADFORGE] Done ${Date.now()-t0}ms via ${providerUsed}, ${result.buf.length}b`);

  const safe = brandName.replace(/\s+/g, '-').toLowerCase().slice(0, 30);
  const filename = `assets/${safe}-scene${sceneIdx}-${Date.now()}.png`;
  let persistentUrl: string;
  try {
    const blob = await put(filename, result.buf, { access: 'public', contentType: 'image/png' });
    persistentUrl = blob.url;
  } catch (e) {
    console.error('[ADFORGE] Blob:', e);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }

  try {
    const session = await auth();
    if (session?.user?.id) {
      const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { quotaTotal: true, quotaUsed: true } });
      if (u && u.quotaUsed < u.quotaTotal) {
        await prisma.$transaction([
          prisma.user.update({ where: { id: session.user.id }, data: { quotaUsed: { increment: 1 } } }),
          prisma.asset.create({ data: {
            userId: session.user.id, imageUrl: persistentUrl, brandName,
            platform: platformLabel(ratio, scene.platform), sceneLabel: scene.label,
            aspectRatio: ratio, sourceUrl: body.sourceUrl || null,
          }}),
        ]);
      }
    }
  } catch (e) { console.error('[ADFORGE] DB:', e); }

  return NextResponse.json({
    image: { url: persistentUrl, platform: platformLabel(ratio, scene.platform), scene: scene.label, ratio },
    provider: providerUsed,
  });
}
