import { NextRequest, NextResponse } from 'next/server';

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, brand, contact } = body;

    if (!name?.trim() || !brand?.trim() || !contact?.trim()) {
      return NextResponse.json({ error: '姓名、品牌链接和联系方式均为必填项' }, { status: 400 });
    }

    const entry = {
      name: name.trim(),
      brand: brand.trim(),
      contact: contact.trim(),
      createdAt: new Date().toISOString(),
    };

    // 尝试 Notion (key 必须完整)
    if (NOTION_API_KEY.length > 20 && NOTION_DATABASE_ID) {
      try {
        const res = await fetch(`https://api.notion.com/v1/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
              'Name': { title: [{ text: { content: entry.name } }] },
              'Brand': { rich_text: [{ text: { content: entry.brand } }] },
              'Contact': { rich_text: [{ text: { content: entry.contact } }] },
            },
          }),
        });

        if (res.ok) {
          return NextResponse.json({ success: true, source: 'notion' });
        }
        const err = await res.json().catch(() => ({}));
        console.error('[WAITLIST] Notion error:', JSON.stringify(err));
      } catch (e) {
        console.error('[WAITLIST] Notion exception:', e);
      }
    }

    // Fallback: 输出到日志（Vercel 只读文件系统，无法本地存储）
    console.log('[WAITLIST] Entry:', JSON.stringify(entry));
    
    // TODO: 接入 Vercel KV 或 Redis 做持久化
    return NextResponse.json({ 
      success: true, 
      source: 'log',
      message: '已记录（Notion 未配置，暂存日志）' 
    });
  } catch (err: any) {
    console.error('[WAITLIST] Error:', err);
    return NextResponse.json({ error: err?.message || '保存失败' }, { status: 500 });
  }
}
