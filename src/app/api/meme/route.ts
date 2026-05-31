import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'config', 'models.json');
const MINIMAX_API = 'https://api.minimax.chat/v1/image_generation';

function readServerConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt, apiKey: userKey } = await req.json();
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const trimmed = prompt.trim();
  if (trimmed.length > 200) {
    return NextResponse.json({ error: 'prompt too long (max 200 chars)' }, { status: 400 });
  }

  // Resolve MiniMax key: user-provided > server config
  const serverConfig = readServerConfig();
  const effectiveKey = userKey?.trim() || serverConfig?.minimax?.apiKey || '';

  if (!effectiveKey) {
    return NextResponse.json(
      { error: '未配置 MiniMax API Key，请在设置中填入', needKey: 'minimax' },
      { status: 400 }
    );
  }

  // Build a rich emoji/meme-style prompt
  const memePrompt = `emoji pack, cute expressive emoji faces, ${trimmed}, colorful kawaii style, white background, centered composition, high detail, sharp, sticker quality`;

  try {
    const res = await fetch(MINIMAX_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model: 'image-01',
        prompt: memePrompt,
        num_images: 4,
        aspect_ratio: '1:1',
        response_format: 'url',
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `MiniMax error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const images: string[] = data.images?.map((img: { url?: string }) => img.url).filter(Boolean) ?? [];

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images returned' }, { status: 502 });
    }

    return NextResponse.json({ images });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
