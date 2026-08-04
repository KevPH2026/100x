'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Zap, Crown, AlertTriangle, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface SubData {
  subscribed: boolean;
  tier: string | null;
  plan: string | null;
  status: string | null;
  renewsAt: string | null;
  endsAt: string | null;
}

interface QuotaData {
  quotaTotal: number;
  quotaUsed: number;
  quotaRemaining: number;
}

export default function SubscriptionBanner() {
  const { data: session, status } = useSession();
  const [sub, setSub] = useState<SubData | null>(null);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch('/api/subscription').then(r => r.json()).catch(() => null),
      fetch('/api/user/me').then(r => r.json()).catch(() => null),
    ]).then(([subData, userData]) => {
      setSub(subData);
      if (userData) {
        setQuota({ quotaTotal: userData.quotaTotal ?? 10, quotaUsed: userData.quotaUsed ?? 0, quotaRemaining: userData.quotaRemaining ?? 10 });
      }
      setLoading(false);
    });
  }, [status]);

  // 未登录或不加载中：不显示
  if (status === 'unauthenticated' || !session) return null;
  if (loading) {
    return (
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 mb-6 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
      </div>
    );
  }

  const isPro = sub?.subscribed && sub?.tier === 'pro';
  const subStatus = sub?.status;

  // Free 用户
  if (!isPro) {
    const used = quota?.quotaUsed ?? 0;
    const total = quota?.quotaTotal ?? 10;
    return (
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-[#fafafa]">免费版</span>
            <span className="text-sm text-[rgba(250,250,250,.4)] mx-2">·</span>
            <span className="text-sm text-[rgba(250,250,250,.6)]">已用 {used}/{total} 张</span>
          </div>
        </div>
        <a
          href="/pricing"
          className="flex items-center gap-1.5 text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-4 py-1.5 rounded-lg transition shadow-sm"
        >
          升级 Pro
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // Pro 用户 — 根据状态显示不同颜色
  const dateStr = (sub?.renewsAt || sub?.endsAt)
    ? new Date(sub.renewsAt ?? sub.endsAt!).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '--';

  // past_due
  if (subStatus === 'past_due') {
    return (
      <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-sm font-medium text-red-300">支付失败，请更新付款方式</span>
        </div>
        <a
          href="/api/subscription/manage"
          className="flex items-center gap-1.5 text-sm font-medium bg-red-600/20 text-red-300 hover:bg-red-600/30 px-4 py-1.5 rounded-lg transition border border-red-800/50"
        >
          管理
        </a>
      </div>
    );
  }

  // cancelled
  if (subStatus === 'cancelled' || subStatus === 'paused') {
    return (
      <div className="bg-yellow-950/50 border border-yellow-800/50 rounded-xl p-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-yellow-300">已取消</span>
            <span className="text-sm text-yellow-500/60 ml-2">到期 {dateStr}</span>
          </div>
        </div>
        <a
          href="/pricing"
          className="flex items-center gap-1.5 text-sm font-medium bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 px-4 py-1.5 rounded-lg transition border border-yellow-800/50"
        >
          重新订阅
        </a>
      </div>
    );
  }

  // Active Pro
  const remaining = quota?.quotaRemaining ?? 500;
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-medium text-violet-300">Pro</span>
          <span className="text-sm text-[rgba(250,250,250,.4)] mx-2">·</span>
          <span className="text-sm text-[rgba(250,250,250,.6)]">剩余 {remaining} 张</span>
          <span className="text-sm text-[rgba(250,250,250,.4)] mx-2">·</span>
          <span className="text-sm text-[rgba(250,250,250,.4)]">到期 {dateStr}</span>
        </div>
      </div>
      <a
        href="/api/subscription/manage"
        className="flex items-center gap-1.5 text-sm font-medium bg-[rgba(255,255,255,.08)] text-[rgba(250,250,250,.7)] hover:bg-[rgba(255,255,255,.12)] hover:text-[#fafafa] px-4 py-1.5 rounded-lg transition"
      >
        管理订阅
      </a>
    </div>
  );
}
