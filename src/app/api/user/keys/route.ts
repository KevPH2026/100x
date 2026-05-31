import { NextRequest, NextResponse } from "next/server";
import { getUserKeys, saveUserKey } from "@/lib/notion";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const keys = await getUserKeys(session.user.email);
    const result: Record<string, { enabled: boolean; label?: string }> = {};
    for (const k of keys) {
      result[k.provider] = { enabled: k.enabled };
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { openrouter, minimax } = await req.json();
    const email = session.user.email;

    if (openrouter) await saveUserKey(email, "openrouter", openrouter);
    if (minimax) await saveUserKey(email, "minimax", minimax);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
