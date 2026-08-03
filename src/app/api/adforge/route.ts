import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { readAppConfig, DEFAULT_SCENES } from '@/lib/app-config';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ── InteractionLog helper (fire-and-forget) ──────────────────────────────────
type InteractionStep = 'user_input' | 'intent_analysis' | 'prompt_build' | 'llm_call'
  | 'image_request' | 'image_response' | 'user_feedback' | 'error';

interface InteractionData {
  userId?: string | null;
  ip?: string | null;
  source?: string;
  userInput?: string | null;
  userImageRef?: string | null;
  llmPrompt?: string | null;
  llmResponse?: string | null;
  llmModel?: string | null;
  llmLatencyMs?: number | null;
  imageModel?: string | null;
  imageUrl?: string | null;
  imageError?: string | null;
  imageLatencyMs?: number | null;
  brandName?: string | null;
  platform?: string | null;
  scene?: string | null;
  ratio?: string | null;
}

function logInteraction(traceId: string, step: InteractionStep, data: InteractionData): void {
  prisma.interactionLog.create({
    data: {
      traceId,
      step,
      userId: data.userId ?? null,
      ip: data.ip ?? null,
      source: data.source ?? 'get',
      userInput: data.userInput?.slice(0, 2000) ?? null,
      userImageRef: data.userImageRef?.slice(0, 500) ?? null,
      llmPrompt: data.llmPrompt?.slice(0, 5000) ?? null,
      llmResponse: data.llmResponse?.slice(0, 2000) ?? null,
      llmModel: data.llmModel ?? null,
      llmLatencyMs: data.llmLatencyMs ?? null,
      imageModel: data.imageModel ?? null,
      imageUrl: data.imageUrl?.slice(0, 1000) ?? null,
      imageError: data.imageError?.slice(0, 1000) ?? null,
      imageLatencyMs: data.imageLatencyMs ?? null,
      brandName: data.brandName?.slice(0, 100) ?? null,
      platform: data.platform?.slice(0, 100) ?? null,
      scene: data.scene?.slice(0, 300) ?? null,
      ratio: data.ratio ?? null,
    },
  }).catch(() => {});
}

function extractIp(req: NextRequest): string | null {
  const raw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  return raw ? raw.replace(/\.\d+$/, '.0') : null;
}


// ── Rate Limiter (in-memory, per-user, sliding window) ──────────────────────
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_PER_WINDOW = 3;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, windowMs: number, maxPerWindow: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    if (rateLimitMap.size > 1000) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
    }
    return { ok: true, retryAfterMs: 0 };
  }
  if (entry.count >= maxPerWindow) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count++;
  return { ok: true, retryAfterMs: 0 };
}

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
  modelName: string = 'openai/gpt-5.4-image-2', timeoutMs: number = 55000,
): Promise<{ buf: Buffer | null; err?: string }> {
  const base = baseUrl.replace(/\/$/, '').trim();
  const T0 = Date.now();
  try {
    const body: Record<string, unknown> = {
      model: modelName,
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
      signal: AbortSignal.timeout(timeoutMs),
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

/** Novart Vertex (configurable model + timeout). */
async function genNovartVertex(
  apiKey: string, baseUrl: string, prompt: string, ratio: string, refUrl: string | undefined,
  modelName: string = 'nova-image-pro', timeoutMs: number = 50000,
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
    console.log(`[NV T+${Date.now()-T0}ms] calling ${modelName}...`);
    const r = await fetch(`${base}/v1beta/models/${modelName}:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs),
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
  const rt = config.agentRuntime;
  const ax = config.adforge100x || {};

  // Runtime config from DB
  const rateWindowMs = rt?.rateLimitWindowMs || DEFAULT_WINDOW_MS;
  const rateMax = rt?.rateLimitMaxPerWindow || DEFAULT_MAX_PER_WINDOW;
  const imageProvider = rt?.imageProvider || 'auto'; // auto = novart优先
  const novartModel = rt?.novartImageModel || 'nova-image-pro';
  const trModel = rt?.tokenrouterImageModel || 'openai/gpt-5.4-image-2';
  const imageTimeoutMs = rt?.imageTimeoutMs || 50000;

  // Rate limit check
  const authResult = await auth();
  if (authResult?.user?.id) {
    const rl = checkRateLimit(authResult.user.id, rateWindowMs, rateMax);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `请求太频繁，请等待 ${Math.ceil(rl.retryAfterMs / 1000)} 秒后再试` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }
  } else {
    // Guest quota check
    const gq = config.quotas?.guest;
    if (gq) {
      if (gq.enabled === false) {
        return NextResponse.json({ error: '游客生成已关闭，请注册后使用', needLogin: true }, { status: 403 });
      }
      if (gq.totalLimit && gq.totalLimit > 0) {
        const guestTotal = await prisma.guestLog.count({ where: { success: true } });
        if (guestTotal >= gq.totalLimit) {
          return NextResponse.json({ error: '游客生成总量已达上限，请注册后使用', needLogin: true }, { status: 403 });
        }
      }
      if (gq.dailyLimit && gq.dailyLimit > 0) {
        const todayStart = new Date(new Date().toISOString().slice(0, 10));
        const guestToday = await prisma.guestLog.count({ where: { success: true, createdAt: { gte: todayStart } } });
        if (guestToday >= gq.dailyLimit) {
          return NextResponse.json({ error: `今日游客生成已达上限（${gq.dailyLimit}次），请明天再试或注册后使用`, needLogin: true }, { status: 429 });
        }
      }
    }
  }

  const trKey = (ax as any).tokenrouterKey || ENV_TR_KEY;
  const trBase = ((ax as any).tokenrouterBaseUrl || ENV_TR_BASE).trim();
  const novartKey = ax.novartKey || ENV_NOVART_KEY;
  const novartBase = (ax.novartBaseUrl || ENV_NOVART_BASE).trim();

  if (!trKey && !novartKey) return NextResponse.json({ error: '未配置图片 API key' }, { status: 400 });

  const body = await req.json();
  const { brandName, sellingPoint, targetCountry, sceneIndex, customSceneDesc, referenceImage,
    campaignTheme, marketingGoal, mood, urgency, cta } = body;

  if (!brandName || !sellingPoint) return NextResponse.json({ error: '品牌名和卖点必填' }, { status: 400 });

  // Trace ID for interaction logging
  const traceId = body.traceId || crypto.randomUUID();
  const sessionForLog = authResult; // reuse the auth call above
  const logSource = body.source || 'get';

  // ── 读取用户记忆 ──────────────────────────────────────
  let userCtx = '';
  try {
    const session = await auth();
    if (session?.user?.id) {
      const [memRows, brandRow] = await Promise.all([
        prisma.userMemory.findMany({ where: { userId: session.user.id } }),
        prisma.userBrand.findUnique({ where: { userId_brandName: { userId: session.user.id, brandName } } }),
      ]);

      const styleMem = memRows.filter(m => m.category === 'style');
      const distMem = memRows.filter(m => m.category === 'distribution');
      const toneMem = memRows.filter(m => m.category === 'brand_tone');

      const prefs: string[] = [];
      if (styleMem.length) prefs.push(...styleMem.map(m => `${m.key}: ${m.value}`));
      if (distMem.length) prefs.push(...distMem.map(m => `${m.key}: ${m.value}`));
      if (toneMem.length) prefs.push(...toneMem.map(m => `${m.key}: ${m.value}`));

      if (brandRow) {
        prefs.push(`brand industry: ${brandRow.industry}`);
        prefs.push(`brand style: ${brandRow.style}`);
        if (brandRow.targetAudience) prefs.push(`target audience: ${brandRow.targetAudience}`);
        if (brandRow.notes) prefs.push(`brand notes: ${brandRow.notes}`);
      }

      if (prefs.length) {
        userCtx = `\nUSER PREFERENCES (learned from history — apply these to make the output match this user's taste):\n${prefs.map(p => `- ${p}`).join('\n')}\n`;
      }
    }
  } catch (e) { console.error('[ADFORGE] Memory read:', e); }

  // Support dynamic ratio/platform from Agent
  const forceRatio = body.forceRatio as string | undefined;
  const forcePlatform = body.forcePlatform as string | undefined;

  const scenes = (ax.scenes && ax.scenes.length > 0) ? ax.scenes : DEFAULT_SCENES;
  const sceneIdx = sceneIndex ?? 0;
  if (sceneIdx < 0 || sceneIdx >= scenes.length && !customSceneDesc) return NextResponse.json({ error: '无效场景索引' }, { status: 400 });
  const scene = scenes[Math.min(sceneIdx, scenes.length - 1)] || { aspectRatio: '1:1', desc: customSceneDesc || 'product shot', label: 'Custom' };
  const ratio = forceRatio || scene.aspectRatio || '1:1';
  const sceneDesc = customSceneDesc?.trim() || scene.desc;

  const hasRef = !!referenceImage;
  const isReEdit = !!body.isReEdit;

  // ── Read prompt template from config (admin-controllable) ──
  const ap = config.agentPrompts || {};
  const templateKey = hasRef ? 'imageGenWithRef' : 'imageGenNoRef';
  let template = ap[templateKey] || '';

  // Variable substitution
  const _mood = mood || 'premium and refined';
  const _country = targetCountry || 'US';
  const _campaign = campaignTheme ? `Campaign: ${campaignTheme}` : '';
  const _goal = marketingGoal ? `Goal: ${marketingGoal}` : '';
  const _urgency = urgency && urgency !== 'none' ? `Urgency: ${urgency}` : '';
  const _cta = cta ? `CTA hint: ${cta}` : '';

  const vars: Record<string, string> = {
    sceneDesc,
    mood: _mood,
    targetCountry: _country,
    brandName,
    sellingPoint,
    ratio,
    campaignTheme: _campaign,
    marketingGoal: _goal,
    urgency: _urgency,
    cta: _cta,
    isReEdit: isReEdit
      ? '\nTHIS IS A RE-EDIT: The user wants to change ONLY the background/scene. The product MUST remain 100% identical to the reference image. Do NOT modify, reimagine, or change the product in any way.\n'
      : '',
  };

  let prompt: string;
  if (template) {
    // Admin customized template — replace {{variables}}
    prompt = template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
    // Append brand context + user preferences (not in template, always needed)
    prompt += `\n\nBRAND CONTEXT:\nBrand: ${brandName}\nProduct: ${sellingPoint}`;
    if (_campaign) prompt += `\n${_campaign}`;
    if (_goal) prompt += `\n${_goal}`;
    if (_urgency) prompt += `\n${_urgency}`;
    if (_cta) prompt += `\n${_cta}`;
    if (userCtx) prompt += userCtx;
  } else {
    // Fallback: hardcoded defaults (same as before)
    const refRules = hasRef
      ? `MISSION: Place the EXACT product from the reference image into a new scene. This is product photography compositing, NOT product redesign.
${isReEdit ? '\nTHIS IS A RE-EDIT: The user wants to change ONLY the background/scene. The product MUST remain 100% identical to the reference image. Do NOT modify, reimagine, or change the product in any way.\n' : ''}
ABSOLUTE RULES — VIOLATING ANY = FAILURE:
1. The product MUST be a pixel-perfect 1:1 replica of the reference image.
2. DO NOT redesign, reimagine, simplify, or improve the product.
3. Match every color hex value, every curve, every contour, every surface finish exactly.
4. Keep all logos, text, engravings, markings as-is.
5. Keep proportions and geometry identical.
6. Do not add or remove buttons, sensors, lights, features.
7. Treat the reference product as a real physical object you are photographing — only the SURROUNDING SCENE changes.
${isReEdit ? '8. The PRODUCT is the star — it must look exactly the same as in the reference, just placed in a different setting.\n' : ''}
WHAT TO CHANGE (the ONLY thing you change):`
      : `Create a stunning product advertisement image.`;

    prompt = `${refRules}
- Scene: ${sceneDesc}
- Mood: ${_mood}
- Target market: ${_country}
- Style: professional product photography, magazine-grade
- Lighting: natural, soft, with realistic shadows and reflections
- Composition: product is the hero, well-positioned, with room to breathe
- Camera: Canon EOS R5, 85mm f/1.4, shallow depth of field

BRAND CONTEXT:
Brand: ${brandName}
Product: ${sellingPoint}
${_campaign}
${_goal}
${_urgency}
${_cta}
${userCtx}
${hasRef ? 'FINAL CHECK: Is the product in my output IDENTICAL to the reference, pixel by pixel? If not, START OVER.' : `Aspect ratio: ${ratio}. Product must be the hero, well-composed, ready for social media.`}`;
  }

  console.log(`[ADFORGE] scene=${sceneIdx} ratio=${ratio} provider=${imageProvider}`);
  const t0 = Date.now();

  let result: { buf: Buffer | null; err?: string } = { buf: null, err: 'no provider' };
  let providerUsed = '';

  // Provider selection based on config: novart | tokenrouter | auto (novart优先)
  const useNovartFirst = imageProvider === 'novart' || imageProvider === 'auto';
  const useTRFirst = imageProvider === 'tokenrouter';

  if (useNovartFirst && novartKey) {
    const nvRatio = NOVART_RATIO_MAP[ratio] || '1:1';
    result = await genNovartVertex(novartKey, novartBase, prompt, nvRatio, referenceImage, novartModel, imageTimeoutMs);
    providerUsed = `novart-${novartModel}`;
    if (!result.buf) console.error('[NV fail]', result.err);
  }
  if (!result.buf && useTRFirst && trKey) {
    const size = TR_SIZE_MAP[ratio] || '1024x1024';
    result = await genTokenRouter(trKey, trBase, prompt, size, referenceImage, trModel, imageTimeoutMs);
    providerUsed = `tr-${trModel}`;
    if (!result.buf) console.error('[TR fail]', result.err);
  }
  // Fallback: if primary failed, try the other
  if (!result.buf && useNovartFirst && trKey) {
    const size = TR_SIZE_MAP[ratio] || '1024x1024';
    result = await genTokenRouter(trKey, trBase, prompt, size, referenceImage, trModel, imageTimeoutMs);
    providerUsed = `tr-${trModel}-fallback`;
    if (!result.buf) console.error('[TR fallback fail]', result.err);
  }
  if (!result.buf && useTRFirst && novartKey) {
    const nvRatio = NOVART_RATIO_MAP[ratio] || '1:1';
    result = await genNovartVertex(novartKey, novartBase, prompt, nvRatio, referenceImage, novartModel, imageTimeoutMs);
    providerUsed = `novart-${novartModel}-fallback`;
    if (!result.buf) console.error('[NV fallback fail]', result.err);
  }

  if (!result.buf) {
    // 记录失败（GenerationLog + GuestLog）
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ip = rawIp ? rawIp.replace(/\.\d+$/, '.0') : null;
    const latencyMs = Date.now() - t0;
    try {
      const session = await auth();
      const userId = session?.user?.id;
      // GenerationLog — always write
      await prisma.generationLog.create({ data: {
        userId: userId || null,
        ip,
        brandName: brandName?.slice(0, 100) || 'unknown',
        prompt: prompt?.slice(0, 2000) || '',
        sceneLabel: scene.label?.slice(0, 50),
        sceneDesc: sceneDesc?.slice(0, 300),
        aspectRatio: ratio,
        platform: forcePlatform || platformLabel(ratio, scene.platform),
        imageModel: providerUsed,
        success: false,
        error: result.err?.slice(0, 200) || 'unknown',
        latencyMs,
        workflow: rt ? { llmModel: rt.llmModel, imageProvider: rt.imageProvider, novartImageModel: rt.novartImageModel } : undefined,
      }}).catch(() => {});
      if (!userId) {
        await prisma.guestLog.create({ data: {
          ip, ua: req.headers.get('user-agent')?.slice(0, 300) || null,
          brandName: brandName?.slice(0, 100) || null,
          sellingPoint: sellingPoint?.slice(0, 200) || null,
          platform: forcePlatform || platformLabel(ratio, scene.platform),
          aspectRatio: ratio, provider: providerUsed,
          success: false, error: result.err?.slice(0, 200) || 'unknown',
        }}).catch(() => {});
      }
    } catch {}

    // ── 记录模型健康日志 ──
    try {
      await prisma.modelHealthLog.create({ data: {
        name: providerUsed || 'unknown-image',
        ok: false,
        latencyMs,
        detail: result.err?.slice(0, 200) || 'unknown',
        type: 'Image',
      }}).catch(() => {});
    } catch {}

    return NextResponse.json({ error: `生成失败: ${result.err || 'unknown'}`, provider: providerUsed, traceId }, { status: 500 });
  }
  console.log(`[ADFORGE] Done ${Date.now()-t0}ms via ${providerUsed}, ${result.buf.length}b`);

  // ── LOG: image_response (成功) ──
  logInteraction(traceId, 'image_response', {
    userId: sessionForLog?.user?.id,
    ip: extractIp(req),
    source: logSource,
    imageModel: providerUsed,
    imageLatencyMs: Date.now() - t0,
    brandName,
    platform: forcePlatform || platformLabel(ratio, scene.platform),
    scene: sceneDesc,
    ratio,
  });

  const safe = brandName.replace(/\s+/g, '-').toLowerCase().slice(0, 30);
  const filename = `assets/${safe}-scene${sceneIdx}-${Date.now()}.png`;
  let persistentUrl: string;
  try {
    const blob = await put(filename, result.buf, { access: 'public', contentType: 'image/png' });
    persistentUrl = blob.url;
  } catch (e) {
    // ── LOG: error (blob上传失败) ──
    logInteraction(traceId, 'error', {
      userId: sessionForLog?.user?.id,
      ip: extractIp(req),
      source: logSource,
      imageError: `blob upload failed: ${String(e).slice(0, 500)}`,
      imageModel: providerUsed,
      imageLatencyMs: Date.now() - t0,
      brandName,
    });
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
            platform: forcePlatform || platformLabel(ratio, scene.platform), sceneLabel: sceneDesc?.slice(0, 50) || scene.label,
            aspectRatio: ratio, sourceUrl: body.sourceUrl || null,
          }}),
        ]);
        // 更新品牌使用计数
        try {
          await prisma.userBrand.upsert({
            where: { userId_brandName: { userId: session.user.id, brandName } },
            update: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
            create: { userId: session.user.id, brandName, usageCount: 1 },
          });
        } catch {}
      }
    } else {
      // ── 未登录用户：记录游客使用 ──
      const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';
      const ip = rawIp ? rawIp.replace(/\.\d+$/, '.0') : null; // 截断 /24 隐私保护
      const ua = req.headers.get('user-agent')?.slice(0, 300) || null;
      await prisma.guestLog.create({ data: {
        ip, ua,
        brandName: brandName?.slice(0, 100) || null,
        sellingPoint: sellingPoint?.slice(0, 200) || null,
        platform: forcePlatform || platformLabel(ratio, scene.platform),
        aspectRatio: ratio,
        imageUrl: persistentUrl,
        provider: providerUsed,
        success: true,
      }}).catch(() => {});
    }
  } catch (e) { console.error('[ADFORGE] DB:', e); }

  // ── 写 GenerationLog（始终记录完整上下文）──
  try {
    const sess = await auth();
    const rawIp2 = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ip2 = rawIp2 ? rawIp2.replace(/\.\d+$/, '.0') : null;
    await prisma.generationLog.create({ data: {
      userId: sess?.user?.id || null,
      ip: ip2,
      brandName: brandName?.slice(0, 100) || 'unknown',
      prompt: prompt?.slice(0, 2000) || '',
      sceneLabel: scene.label?.slice(0, 50),
      sceneDesc: sceneDesc?.slice(0, 300),
      aspectRatio: ratio,
      platform: forcePlatform || platformLabel(ratio, scene.platform),
      style: body.style || null,
      mood: mood || null,
      targetCountry: targetCountry || null,
      imageModel: providerUsed,
      imageUrl: persistentUrl,
      success: true,
      latencyMs: Date.now() - t0,
      workflow: rt ? { llmModel: rt.llmModel, imageProvider: rt.imageProvider, novartImageModel: rt.novartImageModel, imageTimeoutMs: rt.imageTimeoutMs } : undefined,
    }}).catch(() => {});
  } catch {}

  // ── 记录模型健康日志（成功）──
  const finalLatency = Date.now() - t0;
  try {
    await prisma.modelHealthLog.create({ data: {
      name: providerUsed || 'unknown-image',
      ok: true,
      latencyMs: finalLatency,
      detail: `${brandName} ${scene.label || ''}`.slice(0, 200),
      type: 'Image',
    }}).catch(() => {});
  } catch {}

  return NextResponse.json({
    image: { url: persistentUrl, platform: platformLabel(ratio, scene.platform), scene: customSceneDesc?.trim() || scene.label, ratio },
    provider: providerUsed,
  });
}
