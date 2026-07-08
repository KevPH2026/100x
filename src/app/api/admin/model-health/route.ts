import { NextRequest, NextResponse } from 'next/server';

function verifyAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  return token === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results: any[] = [];

  // ── 1. MiniMax LLM ──
  const minimaxKey = process.env.MINIMAX_API_KEY;
  if (minimaxKey) {
    const t0 = Date.now();
    try {
      const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${minimaxKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'MiniMax-Text-01', messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (data.base_resp?.status_code) throw new Error(`API ${data.base_resp.status_code}: ${data.base_resp.status_msg}`);
      if (!data.choices?.[0]?.message?.content) throw new Error('Empty response');
      results.push({ name: 'MiniMax-Text-01 (LLM)', ok: true, latencyMs: Date.now() - t0, detail: data.choices[0].message.content.slice(0, 50), type: 'LLM', usage: '意图识别 + 场景生成' });
    } catch (e: any) {
      results.push({ name: 'MiniMax-Text-01 (LLM)', ok: false, latencyMs: Date.now() - t0, detail: e.message || String(e), type: 'LLM', usage: '意图识别 + 场景生成' });
    }
  } else {
    results.push({ name: 'MiniMax-Text-01 (LLM)', ok: false, latencyMs: 0, detail: 'MINIMAX_API_KEY 未配置', type: 'LLM', usage: '意图识别 + 场景生成' });
  }

  // ── 2. Novart Image ──
  const novartKey = process.env.NOVART_API_KEY;
  const novartBase = process.env.NOVART_BASE_URL || 'https://www.novartspace.art';
  const novartModel = process.env.NOVART_IMAGE_MODEL || 'nova-image-pro';
  if (novartKey) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${novartBase}/v1beta/models/${novartModel}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': novartKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'A white coffee cup on a wooden table, minimalist product photography' }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);
      if (!data.candidates?.[0]?.content?.parts?.some((p: any) => p.inlineData || p.fileData)) throw new Error('No image in response');
      results.push({ name: `${novartModel} (Novart)`, ok: true, latencyMs: Date.now() - t0, detail: 'Image generated OK', type: 'Image', usage: '广告素材生成（主）' });
    } catch (e: any) {
      results.push({ name: `${novartModel} (Novart)`, ok: false, latencyMs: Date.now() - t0, detail: e.message || String(e), type: 'Image', usage: '广告素材生成（主）' });
    }
  } else {
    results.push({ name: `${novartModel} (Novart)`, ok: false, latencyMs: 0, detail: 'NOVART_API_KEY 未配置', type: 'Image', usage: '广告素材生成（主）' });
  }

  // ── 3. Neon DB ──
  const t3 = Date.now();
  try {
    const { prisma } = await import('@/lib/prisma');
    const count = await prisma.user.count();
    results.push({ name: 'Neon PostgreSQL', ok: true, latencyMs: Date.now() - t3, detail: `${count} users in DB`, type: 'Database', usage: '用户/素材/日志存储' });
  } catch (e: any) {
    results.push({ name: 'Neon PostgreSQL', ok: false, latencyMs: Date.now() - t3, detail: e.message || String(e), type: 'Database', usage: '用户/素材/日志存储' });
  }

  // ── 4. Vercel Blob ──
  const t4 = Date.now();
  try {
    const { put } = await import('@vercel/blob');
    const blob = await put(`_health-${Date.now()}.txt`, 'health check', { access: 'public' });
    const check = await fetch(blob.url);
    if (!check.ok) throw new Error(`HTTP ${check.status}`);
    results.push({ name: 'Vercel Blob Storage', ok: true, latencyMs: Date.now() - t4, detail: 'Write + Read OK', type: 'Storage', usage: '生成图片持久化' });
  } catch (e: any) {
    results.push({ name: 'Vercel Blob Storage', ok: false, latencyMs: Date.now() - t4, detail: e.message || String(e), type: 'Storage', usage: '生成图片持久化' });
  }

  // ── 5. NextAuth ──
  const t5 = Date.now();
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'https://100x.pics'}/api/auth/providers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const providers = await res.json();
    results.push({ name: 'NextAuth', ok: true, latencyMs: Date.now() - t5, detail: Object.keys(providers).join(', '), type: 'Auth', usage: '用户登录/注册' });
  } catch (e: any) {
    results.push({ name: 'NextAuth', ok: false, latencyMs: Date.now() - t5, detail: e.message || String(e), type: 'Auth', usage: '用户登录/注册' });
  }

  return NextResponse.json({ checkedAt: new Date().toISOString(), results });
}
