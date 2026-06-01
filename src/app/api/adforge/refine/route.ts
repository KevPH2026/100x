import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { readAppConfig, renderPrompt, DEFAULT_REFINE_PROMPT } from '@/lib/app-config';

export const maxDuration = 60;

const ENV_MINIMAX_KEY = process.env.MINIMAX_API_KEY || '';
const ENV_NOVART_KEY = process.env.NOVART_API_KEY || '';
const ENV_NOVART_BASE = (process.env.NOVART_BASE_URL || 'https://www.novartspace.art').trim();

const MINIMAX_RATIO_MAP: Record<string, string> = {
  '1:1': '1:1', '16:9': '16:9', '9:16': '9:16', '4:3': '4:3', '2:3': '2:3', '3:2': '3:2',
};
const NOVART_RATIO_MAP: Record<string, string> = {
  '1:1': '1:1', '16:9': '16:9', '9:16': '9:16', '3:2': '3:2', '2:3': '2:3', '4:3': 'auto', '3:4': 'auto',
};

/**
 * 把 url 上的图下载成 base64（refine 时把上一张图作为参考传回去）
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString('base64');
  } catch {
    return null;
  }
}

/** Novart refine 调用 — 用 image 参数注入原图做 img2img */
async function refineWithNovart(
  apiKey: string, baseUrl: string, model: string,
  prompt: string, aspectRatio: string, sourceB64: string,
): Promise<{ imageUrl?: string; b64?: string } | null> {
  const base = baseUrl.replace(/\/$/, '').trim();
  const ratio = NOVART_RATIO_MAP[aspectRatio] || 'auto';
  try {
    // 用 OpenAI 兼容接口的 image 参数做 img2img，而非 reference_images
    const reqBody: any = {
      model: model || 'nova-image-2',
      prompt,
      n: 1,
      aspect_ratio: ratio,
      response_format: 'b64_json',
      image: sourceB64,  // img2img: 以原图为基础编辑
      image_weight: 0.7, // 保持原图主体 70% 权重
    };
    const res = await fetch(`${base}/v1/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(55000),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`[REFINE-NOVART] ${res.status}: ${t.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const item = data?.data?.[0];
    if (item?.url) return { imageUrl: item.url };
    if (item?.b64_json) return { b64: item.b64_json };
    return null;
  } catch (err: any) {
    console.error('[REFINE-NOVART] err', err?.message);
    return null;
  }
}

/** MiniMax refine — 用 image 参数做 img2img */
async function refineWithMinimax(
  apiKey: string, model: string, prompt: string, aspectRatio: string, sourceB64: string,
): Promise<{ imageUrl: string } | null> {
  const ratio = MINIMAX_RATIO_MAP[aspectRatio] || '1:1';
  try {
    const reqBody: any = {
      model: model || 'image-01',
      prompt,
      aspect_ratio: ratio,
      response_format: 'url',
      n: 1,
      image: sourceB64,       // img2img: 以原图为基础编辑
      image_weight: 0.7,      // 保持原图主体 70% 权重
    };
    const res = await fetch('https://api.minimax.chat/v1/image_generation', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(55000),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`[REFINE-MINIMAX] ${res.status}: ${t.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    if (data?.base_resp?.status_code && data.base_resp.status_code !== 0) {
      console.error('[REFINE-MINIMAX] biz error:', data.base_resp);
      return null;
    }
    const urls: string[] = data?.data?.image_urls || [];
    if (urls.length > 0 && urls[0]) return { imageUrl: urls[0] };
    return null;
  } catch (err: any) {
    console.error('[REFINE-MINIMAX] err', err?.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const config = await readAppConfig();
  const ax = config.adforge100x || {};
  const provider = ax.imageProvider || 'minimax';

  const minimaxKey = config.minimax?.apiKey || ENV_MINIMAX_KEY;
  const novartKey = ax.novartKey || ENV_NOVART_KEY;
  const novartBase = (ax.novartBaseUrl || ENV_NOVART_BASE).trim();

  if (provider === 'minimax' && !minimaxKey) {
    return NextResponse.json({ error: '未配置 MiniMax key' }, { status: 400 });
  }
  if (provider === 'novart' && !novartKey) {
    return NextResponse.json({ error: '未配置 Novart key' }, { status: 400 });
  }

  const body = await req.json();
  const { sourceImageUrl, instruction, aspectRatio, brandDNA, brandName, scene, platform } = body;

  if (!sourceImageUrl || !instruction?.trim()) {
    return NextResponse.json({ error: '原图URL和指令必填' }, { status: 400 });
  }

  // 把原图下载为 base64
  const sourceB64 = await fetchImageAsBase64(sourceImageUrl);
  if (!sourceB64) {
    return NextResponse.json({ error: '无法读取原图' }, { status: 400 });
  }

  const tpl = ax.refinePromptTemplate || DEFAULT_REFINE_PROMPT;
  const prompt = renderPrompt(tpl, {
    userInstruction: instruction.trim(),
    brandDNA: brandDNA || null,
  });

  const ratio = aspectRatio || '1:1';

  let result: { imageUrl?: string; b64?: string } | null = null;
  if (provider === 'novart') {
    result = await refineWithNovart(novartKey, novartBase, ax.novartModel || 'nova-image-2', prompt, ratio, sourceB64);
  } else {
    const r = await refineWithMinimax(minimaxKey, ax.minimaxModel || 'image-01', prompt, ratio, sourceB64);
    if (r) result = { imageUrl: r.imageUrl };
  }

  if (!result || (!result.imageUrl && !result.b64)) {
    return NextResponse.json({ error: '再编辑失败,请稍后重试' }, { status: 500 });
  }

  // 持久化到 Blob
  let persistentUrl = result.imageUrl || '';
  try {
    const safeBrand = (brandName || 'refine').replace(/\s+/g, '-').toLowerCase().slice(0, 30);
    const filename = `assets/${safeBrand}-refine-${Date.now()}.jpg`;
    if (result.b64) {
      const buf = Buffer.from(result.b64, 'base64');
      const blob = await put(filename, buf, { access: 'public', contentType: 'image/jpeg' });
      persistentUrl = blob.url;
    } else if (result.imageUrl) {
      const dl = await fetch(result.imageUrl, { signal: AbortSignal.timeout(20000) });
      if (dl.ok) {
        const buf = Buffer.from(await dl.arrayBuffer());
        const ct = dl.headers.get('content-type') || 'image/jpeg';
        const blob = await put(filename, buf, { access: 'public', contentType: ct });
        persistentUrl = blob.url;
      }
    }
  } catch (e) {
    console.error('[REFINE] Blob upload failed:', e);
  }

  // 写 quota + assets
  try {
    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { quotaTotal: true, quotaUsed: true },
    });
    if (user && user.quotaUsed < user.quotaTotal) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { quotaUsed: { increment: 1 } } }),
        prisma.asset.create({
          data: {
            userId, imageUrl: persistentUrl,
            brandName: brandName || '',
            platform: platform || 'Refined',
            sceneLabel: `${scene || ''} (refined: ${instruction.slice(0, 30)})`,
            aspectRatio: ratio,
          },
        }),
      ]);
    }
  } catch (e) {
    console.error('[REFINE] DB write failed:', e);
  }

  return NextResponse.json({
    image: { url: persistentUrl, ratio },
    provider,
    instruction,
  });
}
