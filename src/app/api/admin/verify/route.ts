import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export async function POST(req: NextRequest) {
  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD 环境变量未设置" }, { status: 500 });
  }
  try {
    const { password } = await req.json();
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true, token: ADMIN_PASSWORD });
    }
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "请求失败" }, { status: 400 });
  }
}

// 验证 token 是否有效
export async function GET(req: NextRequest) {
  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD 环境变量未设置" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (token === ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "未授权" }, { status: 401 });
}
