import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserQuotas } from "@/lib/notion";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const quota = await getUserQuotas(session.user.email);
    if (!quota) {
      return NextResponse.json({ freeUsed: 0, freeTotal: 5 });
    }
    return NextResponse.json({
      freeUsed: quota.turnsUsed,
      freeTotal: quota.quotasRemaining + quota.turnsUsed,
      quotasRemaining: quota.quotasRemaining,
    });
  } catch {
    return NextResponse.json({ freeUsed: 0, freeTotal: 5 });
  }
}
