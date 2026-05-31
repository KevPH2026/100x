import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const maxDuration = 30;

interface ScrapeResult {
  title: string;
  description: string;
  images: string[];           // 最多5张主图 URL
  brand: string;
  keywords: string[];
  price?: string;
  sourceUrl: string;
}

function resolveUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function isValidImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(u.pathname) || u.hostname !== '';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!url?.trim()) {
    return NextResponse.json({ error: '请提供网址' }, { status: 400 });
  }

  // 规范化 URL
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    const res = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `页面无法访问 (HTTP ${res.status})` },
        { status: 422 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // ── 提取标题 ──────────────────────────────────────────
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    // ── 提取描述 ──────────────────────────────────────────
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('p').first().text().slice(0, 200) ||
      '';

    // ── 提取品牌名 ────────────────────────────────────────
    const brand =
      $('meta[property="og:site_name"]').attr('content') ||
      $('meta[name="application-name"]').attr('content') ||
      new URL(normalizedUrl).hostname.replace(/^www\./, '').split('.')[0] ||
      '';

    // ── 提取关键词 ────────────────────────────────────────
    const kwRaw = $('meta[name="keywords"]').attr('content') || '';
    const keywords = kwRaw
      ? kwRaw.split(/[,，;；]/).map(k => k.trim()).filter(Boolean).slice(0, 8)
      : [];

    // ── 提取价格 ──────────────────────────────────────────
    const price =
      $('[itemprop="price"]').attr('content') ||
      $('[class*="price"]').first().text().trim().slice(0, 30) ||
      undefined;

    // ── 提取图片 ──────────────────────────────────────────
    const imageSet = new Set<string>();

    // 0. 黑名单关键字（logo, icon, favicon, sprite）
    const isJunk = (u: string) => /logo|icon|favicon|sprite|placeholder|pixel|tracking/i.test(u);

    // 1. OG / Twitter 主图（最高优先级，通常是产品 hero）
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && !isJunk(ogImage)) imageSet.add(resolveUrl(normalizedUrl, ogImage));
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && !isJunk(twitterImage)) imageSet.add(resolveUrl(normalizedUrl, twitterImage));

    // 2. JSON-LD schema.org Product/ImageObject
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          const imgs: any = item?.image || item?.images;
          if (typeof imgs === 'string') imageSet.add(resolveUrl(normalizedUrl, imgs));
          else if (Array.isArray(imgs)) imgs.forEach(i => {
            const u = typeof i === 'string' ? i : i?.url;
            if (u && !isJunk(u)) imageSet.add(resolveUrl(normalizedUrl, u));
          });
        }
      } catch { /* skip */ }
    });

    // 3. 所有 img/source — 收集 src + srcset 最大尺寸版本
    const collectFromEl = (el: any) => {
      const $el = $(el);
      const candidates: string[] = [];
      const src = $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src');
      if (src) candidates.push(src);
      const srcset = $el.attr('srcset') || $el.attr('data-srcset');
      if (srcset) {
        // 取最大尺寸：解析 "url 330w, url 660w"
        const parts = srcset.split(',').map(s => s.trim());
        let best = '';
        let bestW = 0;
        for (const p of parts) {
          const [u, w] = p.split(/\s+/);
          const wn = parseInt(w || '0');
          if (u && wn >= bestW) { best = u; bestW = wn; }
        }
        if (best) candidates.push(best);
      }
      const w = parseInt($el.attr('width') || '0');
      const h = parseInt($el.attr('height') || '0');
      // 过滤小图（icons/avatars）
      if ((w > 0 && w < 200) || (h > 0 && h < 200)) return;
      for (const c of candidates) {
        if (!c || c.startsWith('data:')) continue;
        if (isJunk(c)) continue;
        const abs = resolveUrl(normalizedUrl, c);
        if (isValidImageUrl(abs)) imageSet.add(abs);
      }
    };

    // 优先：含 product/hero/gallery/showcase/detail 关键字 class 的图
    $('img, source').each((_, el) => {
      if (imageSet.size >= 12) return false;
      const cls = ($(el).attr('class') || '').toLowerCase();
      const parentCls = ($(el).parent().attr('class') || '').toLowerCase();
      const combined = cls + ' ' + parentCls;
      if (/product|hero|gallery|showcase|detail|slider|carousel|main|feature/.test(combined)) {
        collectFromEl(el);
      }
    });

    // 兜底：所有大图
    if (imageSet.size < 5) {
      $('img').each((_, el) => {
        if (imageSet.size >= 12) return false;
        collectFromEl(el);
      });
    }

    // 4. Shopify products.json 兜底（仅 /products/{handle} 页面）
    const shopifyMatch = normalizedUrl.match(/^(https?:\/\/[^/]+)\/products\/([^/?#]+)/i);
    if (shopifyMatch) {
      try {
        const productJsonUrl = `${shopifyMatch[1]}/products/${shopifyMatch[2]}.json`;
        const pres = await fetch(productJsonUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (pres.ok) {
          const pjson = await pres.json();
          const pImages = pjson?.product?.images || [];
          for (const im of pImages.slice(0, 8)) {
            if (im?.src) imageSet.add(im.src);
          }
        }
      } catch { /* skip */ }
    }

    const images = Array.from(imageSet).slice(0, 8);

    const result: ScrapeResult = {
      title: title.trim().slice(0, 100),
      description: description.trim().slice(0, 500),
      images,
      brand: brand.trim().slice(0, 50),
      keywords,
      price,
      sourceUrl: normalizedUrl,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[SCRAPE]', err?.message);
    return NextResponse.json(
      { error: '解析失败，请检查网址是否可访问' },
      { status: 422 }
    );
  }
}
