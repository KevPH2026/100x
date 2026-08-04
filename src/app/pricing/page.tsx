'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, X, Crown, Zap, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// ─── 类型 ────────────────────────────────────────────────────
interface SubStatus {
  subscribed: boolean;
  tier: string | null;
  plan: string | null;
  status: string | null;
  renewsAt: string | null;
  endsAt: string | null;
}

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PlanData {
  name: string;
  badge: string | null;
  priceMonthly: string | null;
  priceYearly: string | null;
  period: string;
  periodNote?: string;
  features: PlanFeature[];
}

// ─── 定价数据 ────────────────────────────────────────────────
const PLANS: Record<string, PlanData> = {
  free: {
    name: 'Free',
    badge: null,
    priceMonthly: '¥0',
    priceYearly: '¥0',
    period: '永久免费',
    features: [
      { label: '10 张素材/月', included: true },
      { label: '基础场景模板', included: true },
      { label: '1:1 比例', included: true },
      { label: '品牌记忆', included: false },
      { label: '全比例（9:16, 16:9, 3:4, 2:3）', included: false },
      { label: 'Priority 支持', included: false },
      { label: 'Prompt 优化', included: false },
    ],
  },
  proMonthly: {
    name: 'Pro',
    badge: null,
    priceMonthly: '$9.9',
    priceYearly: null,
    period: '/月',
    features: [
      { label: '500 张素材/月', included: true },
      { label: '全部场景模板', included: true },
      { label: '1:1, 9:16, 16:9, 3:4, 2:3', included: true },
      { label: '品牌记忆', included: true },
      { label: 'Priority 支持', included: true },
      { label: 'Prompt 优化', included: true },
    ],
  },
  proYearly: {
    name: 'Pro',
    badge: '推荐',
    priceMonthly: null,
    priceYearly: '$79',
    period: '/年',
    periodNote: '省 34%',
    features: [
      { label: '500 张素材/月', included: true },
      { label: '全部场景模板', included: true },
      { label: '1:1, 9:16, 16:9, 3:4, 2:3', included: true },
      { label: '品牌记忆', included: true },
      { label: 'Priority 支持', included: true },
      { label: 'Prompt 优化', included: true },
    ],
  },
};

// ─── FAQ ───────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Pro 和 Free 的主要区别是什么？',
    a: 'Pro 方案提供 50 倍的素材配额（500 张/月 vs 10 张/月），解锁全部场景模板、所有图片比例、品牌记忆、Priority 支持以及 AI Prompt 优化功能。',
  },
  {
    q: '年付方案可以退款吗？',
    a: '所有计划均不含退款。年付方案在购买后立即生效，建议先试用月付方案确认满意后再升级年付。',
  },
  {
    q: '素材配额用完后怎么办？',
    a: '当月配额用完后，需要等到下个月 1 日自动重置。你也可以随时升级到 Pro 方案获取更多配额。',
  },
  {
    q: '可以随时取消订阅吗？',
    a: '可以。取消后你仍可使用 Pro 功能直到当前计费周期结束。之后会自动降级为 Free 方案。',
  },
];

// ─── Toast 组件 ────────────────────────────────────────────────
function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700/50 rounded-xl px-5 py-3 shadow-2xl">
        <span className="text-sm text-zinc-200">{message}</span>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── 主页面 ──────────────────────────────────────────────────
export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/subscription')
        .then(r => r.json())
        .then(data => setSubStatus(data))
        .catch(() => {});
    }
  }, [status]);

  const showToast = (msg: string) => {
    setToast({ message: msg, visible: true });
  };

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (status !== 'authenticated') {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, tier: 'pro' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || '即将上线，敬请期待');
        return;
      }

      const data = await res.json();
      if (data.url) {
        if (data.mock) {
          showToast('🎉 Mock订阅已激活！跳转到Dashboard...');
        }
        window.location.href = data.url;
      } else {
        showToast('即将上线，敬请期待');
      }
    } catch {
      showToast('即将上线，敬请期待');
    } finally {
      setLoading(null);
    }
  };

  const isPro = !!(subStatus?.subscribed && subStatus?.tier === 'pro' && subStatus?.status === 'active');

  return (
    <div
      className="min-h-screen text-[#fafafa]"
      style={{
        background: '#09090b',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Nav */}
      <nav className="border-b border-[rgba(255,255,255,.06)] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-xl z-40">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="100x" className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-[#f97316] via-[#ec4899] to-[#8b5cf6] bg-clip-text text-transparent">
            100x
          </span>
        </a>
        <div className="flex items-center gap-3">
          {status === 'authenticated' ? (
            <a href="/dashboard" className="flex items-center gap-1.5 text-sm text-[rgba(250,250,250,.6)] hover:text-[#fafafa] transition">
              <Zap className="w-3.5 h-3.5" />
              Dashboard
            </a>
          ) : (
            <a href="/login?redirect=/pricing" className="flex items-center gap-1.5 bg-gradient-to-r from-[#f97316] to-[#ec4899] hover:from-[#fb923c] hover:to-[#f472b6] text-[#fafafa] text-sm px-4 py-2 rounded-lg transition font-medium">
              登录
            </a>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#fafafa] mb-3">选择你的方案</h1>
          <p className="text-[rgba(250,250,250,.5)] text-base">简单定价，无隐藏费用</p>

          {/* 月/年 Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm transition ${!isYearly ? 'text-[#fafafa] font-medium' : 'text-[rgba(250,250,250,.4)]'}`}>
              月付
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-violet-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className="absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300"
                style={{ transform: isYearly ? 'translateX(26px)' : 'translateX(2px)' }}
              />
            </button>
            <span className={`text-sm transition ${isYearly ? 'text-[#fafafa] font-medium' : 'text-[rgba(250,250,250,.4)]'}`}>
              年付
            </span>
            {isYearly && (
              <span className="text-[10px] bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">
                省 34%
              </span>
            )}
          </div>
        </div>

        {/* 定价卡片: Free / Pro月付 / Pro年付 — toggle影响Pro高亮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {/* Free */}
          <PricingCard
            plan={PLANS.free}
            current={!!(subStatus && !subStatus.subscribed)}
            cta={status !== 'authenticated' ? '免费开始' : !subStatus?.subscribed ? '当前方案' : '降级到 Free'}
            onCta={() => {
              if (status !== 'authenticated') router.push('/login?redirect=/pricing');
            }}
            disabled={status === 'authenticated' && !subStatus?.subscribed}
          />

          {/* Pro 月付 */}
          <PricingCard
            plan={PLANS.proMonthly}
            current={!isYearly && isPro}
            cta={status !== 'authenticated' ? '升级到 Pro' : !isYearly && isPro ? '当前方案' : '升级到 Pro'}
            onCta={() => handleUpgrade('monthly')}
            loading={loading === 'monthly'}
            disabled={!isYearly && isPro}
          />

          {/* Pro 年付 */}
          <PricingCard
            plan={PLANS.proYearly}
            current={isYearly && isPro}
            cta={status !== 'authenticated' ? '升级到 Pro' : isYearly && isPro ? '当前方案' : '升级到 Pro'}
            onCta={() => handleUpgrade('yearly')}
            loading={loading === 'yearly'}
            disabled={isYearly && isPro}
          />
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-[#fafafa] text-center mb-8">常见问题</h2>
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-[rgba(250,250,250,.85)]">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[rgba(250,250,250,.35)] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[rgba(250,250,250,.35)] shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm text-[rgba(250,250,250,.5)] leading-relaxed border-t border-[rgba(255,255,255,.04)] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-[rgba(250,250,250,.25)] text-xs mt-8">所有计划均不含退款</p>
        </div>
      </div>
    </div>
  );
}

// ─── 定价卡片组件 ──────────────────────────────────────────────
function PricingCard({
  plan,
  current,
  cta,
  onCta,
  loading = false,
  disabled = false,
}: {
  plan: PlanData;
  current: boolean;
  cta: string;
  onCta: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const hasBadge = plan.badge !== null;

  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${
        current
          ? 'bg-[rgba(255,255,255,.05)] border-2 border-violet-500/50'
          : hasBadge
          ? 'bg-[rgba(139,92,246,.06)] border border-violet-500/30'
          : 'bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)]'
      } hover:border-[rgba(255,255,255,.12)]`}
    >
      {/* Badge */}
      {hasBadge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-violet-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg shadow-violet-600/20">
            {plan.badge}
          </span>
        </div>
      )}

      {/* 当前方案标识 */}
      {current && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">
            当前方案
          </span>
        </div>
      )}

      {/* 名称 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#fafafa] flex items-center gap-2">
          {plan.name === 'Pro' && <Crown className="w-4 h-4 text-violet-400" />}
          {plan.name}
        </h3>
      </div>

      {/* 价格 */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[#fafafa]">{plan.priceMonthly ?? plan.priceYearly}</span>
          <span className="text-sm text-[rgba(250,250,250,.4)]">{plan.period}</span>
        </div>
        {plan.periodNote && (
          <span className="text-xs text-violet-400 font-medium">{plan.periodNote}</span>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onCta}
        disabled={disabled || loading}
        className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 mb-6 flex items-center justify-center gap-2 ${
          disabled
            ? 'bg-[rgba(255,255,255,.06)] text-[rgba(250,250,250,.35)] cursor-not-allowed'
            : plan.name === 'Free'
            ? 'bg-[rgba(255,255,255,.08)] text-[rgba(250,250,250,.7)] hover:bg-[rgba(255,255,255,.12)] hover:text-[#fafafa]'
            : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30'
        }`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {cta}
      </button>

      {/* 权益列表 */}
      <div className="flex-1 space-y-3">
        {plan.features.map((feat, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            {feat.included ? (
              <Check className="w-4 h-4 text-violet-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-zinc-600 shrink-0" />
            )}
            <span className={`text-sm ${feat.included ? 'text-[rgba(250,250,250,.7)]' : 'text-[rgba(250,250,250,.25)]'}`}>
              {feat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
