import { put } from '@vercel/blob';

/**
 * 参考图持久化：dataUrl → Vercel Blob URL（assets/refs/ 目录）
 * - http(s) URL 原样返回（已是持久链接）
 * - 上传失败返回 null（不阻塞主流程）
 * 用途：interaction_logs.userImageRef / generation_logs.workflow.refImageUrl 可追溯
 */
export async function persistRefImage(
  referenceImage: string | undefined | null,
  keyPrefix: string,
): Promise<string | null> {
  if (!referenceImage) return null;
  // 已是URL，直接用
  if (/^https?:\/\//.test(referenceImage)) return referenceImage;
  // dataUrl → Blob
  const m = referenceImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!m) return null;
  try {
    const mime = m[1];
    const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
    const safe = keyPrefix.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'ref';
    const filename = `assets/refs/${safe}-${Date.now()}.${ext}`;
    const buf = Buffer.from(m[2], 'base64');
    const blob = await put(filename, buf, { access: 'public', contentType: mime });
    return blob.url;
  } catch {
    return null;
  }
}
