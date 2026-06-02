'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Download, LogOut, Zap, Image as ImageIcon, ChevronRight, LayoutGrid,
  X, ChevronLeft, ChevronRight as ChevronRightIcon, Filter, Sparkles,
  Brain, Wand2, Lightbulb, ArrowRight, Eye, Trash2
} from 'lucide-react';

interface Asset {
  id: string;
  imageUrl: string;
  brandName: string;
  platform: string;
  sceneLabel: string;
  aspectRatio: string;
  headline: string | null;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  quotaTotal: number;
  quotaUsed: number;
  quotaRemaining: number;
  assets: Asset[];
}

// ─── 平台筛选配置 ─────────────────────────────────────────────
const PLATFORM_FILTERS = [
  { key: 'all', label: '全部', icon: LayoutGrid },
  { key: 'IG Feed', label: 'IG Feed', short: '1:1' },
  { key: 'Story', label: 'Story', short: '9:16' },
  { key: 'TikTok', label: 'TikTok', short: '9:16' },
  { key: 'FB', label: 'Facebook', short: '16:9' },
  { key: 'Pinterest', label: 'Pinterest', short: '2:3' },
];

// ─── 品牌筛选 ─────────────────────────────────────────────────
function getBrands(assets: Asset[]): string[] {
  const set = new Set(assets.map(a => a.brandName));
  return Array.from(set).sort();
}

// ─── 图片预览 Modal ───────────────────────────────────────────
function ImagePreview({ asset, onClose, onPrev, onNext, hasPrev, hasNext, onDelete }: {
  asset: Asset;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onDelete: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full mx-4 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose}
          className="absolute -top-12 right-0 text-zinc-400 hover:text-white transition p-2">
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
          <div className="flex items-center justify-center bg-zinc-950 min-h-[300px] max-h-[70vh] relative">
            <img
              src={asset.imageUrl}
              alt={asset.sceneLabel}
              className="max-w-full max-h-[70vh] object-contain"
            />
            {/* 水印 */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
              <span className="text-white/10 text-5xl font-black tracking-widest -rotate-12">100x</span>
            </div>
          </div>

          {/* Info bar */}
          <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white text-sm">{asset.brandName}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-zinc-400">{asset.sceneLabel}</span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-400">{asset.platform}</span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-400">{asset.aspectRatio}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600">
                {new Date(asset.createdAt).toLocaleDateString('zh-CN')}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white text-xs px-4 py-2 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (async () => {
                    try {
                      const consumeRes = await fetch('/api/quota/consume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) });
                      if (!consumeRes.ok) {
                        const err = await consumeRes.json().catch(() => ({}));
                        alert(err.error || '下载失败');
                        return;
                      }
                      const a = document.createElement('a');
                      a.href = asset.imageUrl;
                      a.download = `${asset.brandName}-${asset.sceneLabel}.png`;
                      a.click();
                    } catch { alert('下载出错'); }
                  })();
                }}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs px-4 py-2 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                下载（扣1配额）
              </button>
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        {hasPrev && (
          <button onClick={onPrev}
            className="absolute left-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button onClick={onNext}
            className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 主动推荐卡片 ─────────────────────────────────────────────
function ProactiveSuggestion({ assetCount, lastBrand }: { assetCount: number; lastBrand?: string }) {
  const suggestions = useMemo(() => {
    const pool = [
      { icon: Brain, color: 'violet', text: '基于你已生成的素材，AI 可以自动延展新的场景组合' },
      { icon: Wand2, color: 'blue', text: '试试让 AI 为同一产品生成不同风格的素材变体' },
      { icon: Lightbulb, color: 'amber', text: '品牌素材覆盖率不足，建议补充 Story 和 TikTok 竖版素材' },
      { icon: Sparkles, color: 'emerald', text: 'AI 已学习你的品牌风格，下次生成将更精准' },
    ];
    // 根据素材数量和品牌给出不同建议
    if (assetCount === 0) {
      return { icon: ArrowRight, color: 'violet', text: '还没有素材？上传产品图，AI 主动为你生成全套广告创意' };
    }
    if (lastBrand) {
      pool.push({ icon: Eye, color: 'rose', text: `「${lastBrand}」的素材可以扩展到更多平台 — 让 AI 推荐适配场景` });
    }
    return pool[Math.floor(Date.now() / 60000) % pool.length];
  }, [assetCount, lastBrand]);

  const colorMap: Record<string, string> = {
    violet: 'from-violet-500/10 border-violet-500/20 text-violet-400',
    blue: 'from-blue-500/10 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'from-rose-500/10 border-rose-500/20 text-rose-400',
  };
  const c = colorMap[suggestions.color] || colorMap.violet;
  const Icon = suggestions.icon;

  return (
    <div className={`bg-gradient-to-r ${c.split(' ').slice(0, 2).join(' ')} to-transparent border ${c.split(' ')[2]} rounded-xl p-5 flex items-start gap-4`}>
      <div className={`mt-0.5 ${c.split(' ')[3]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">AI 主动推荐</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{suggestions.text}</p>
      </div>
      <a href="/get" className={`shrink-0 flex items-center gap-1 text-xs font-medium ${c.split(' ')[3]} hover:underline whitespace-nowrap`}>
        去生成 <ChevronRight className="w-3 h-3" />
      </a>
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [platformFilter, setPlatformFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/user/me')
        .then(r => r.json())
        .then(data => {
          setUserData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  // 过滤素材
  const filteredAssets = useMemo(() => {
    if (!userData?.assets) return [];
    let list = userData.assets;
    if (platformFilter !== 'all') {
      list = list.filter(a => a.platform.includes(platformFilter));
    }
    if (brandFilter !== 'all') {
      list = list.filter(a => a.brandName === brandFilter);
    }
    return list;
  }, [userData?.assets, platformFilter, brandFilter]);

  const brands = useMemo(() => getBrands(userData?.assets || []), [userData?.assets]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const quotaPercent = userData
    ? Math.round((userData.quotaUsed / Math.max(userData.quotaTotal, 1)) * 100)
    : 0;

  const previewAsset = previewIndex !== null ? filteredAssets[previewIndex] : null;

  const deleteAsset = async (assetId: string) => {
    if (!confirm('确定要删除这个素材吗？删除后无法恢复。')) return;
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUserData(prev => prev ? {
        ...prev,
        assets: prev.assets.filter(a => a.id !== assetId),
        quotaUsed: Math.max(0, prev.quotaUsed - 1),
        quotaRemaining: prev.quotaRemaining + 1,
      } : prev);
      setPreviewIndex(null);
    } catch {
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Preview Modal */}
      {(() => {
        const pi = previewIndex as number;
        return previewAsset ? (
          <ImagePreview
            asset={previewAsset}
            onClose={() => setPreviewIndex(null)}
            onPrev={() => pi > 0 && setPreviewIndex(pi - 1)}
            onNext={() => pi < filteredAssets.length - 1 && setPreviewIndex(pi + 1)}
            hasPrev={pi > 0}
            hasNext={pi < filteredAssets.length - 1}
            onDelete={() => deleteAsset(previewAsset.id)}
          />
        ) : null;
      })()}

      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur-sm z-40">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="100x" className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">100x</span>
          <span className="text-xs text-zinc-600 hidden sm:block">创意中心</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/get"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            生成素材
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header row: user info + quota */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xl font-bold shrink-0">
              {(userData?.name || session.user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-semibold">{userData?.name || '我的账户'}</h1>
              <p className="text-zinc-500 text-sm">{session.user?.email}</p>
            </div>
          </div>

          {/* Quota mini bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 flex items-center gap-4 min-w-[280px]">
            <Zap className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-zinc-400">配额</span>
                <span className="text-xs font-mono">
                  <span className="text-white font-semibold">{userData?.quotaUsed ?? 0}</span>
                  <span className="text-zinc-600"> / {userData?.quotaTotal ?? 0}</span>
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700"
                  style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 主动推荐 */}
        <div className="mb-8">
          <ProactiveSuggestion
            assetCount={userData?.assets?.length ?? 0}
            lastBrand={userData?.assets?.[0]?.brandName}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{userData?.assets?.length ?? 0}</div>
            <div className="text-xs text-zinc-500 mt-1">已生成素材</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{brands.length}</div>
            <div className="text-xs text-zinc-500 mt-1">品牌数量</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{userData?.quotaRemaining ?? 0}</div>
            <div className="text-xs text-zinc-500 mt-1">剩余配额</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 font-medium">筛选</span>
          </div>

          {/* 平台筛选 */}
          <div className="flex flex-wrap gap-1.5">
            {PLATFORM_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setPlatformFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  platformFilter === f.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {f.label}
                {f.short && <span className="ml-1 text-zinc-500 font-mono">{f.short}</span>}
              </button>
            ))}
          </div>

          {/* 品牌筛选 */}
          {brands.length > 1 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500"
              >
                <option value="all">全部品牌</option>
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Assets Grid */}
        {!userData?.assets || userData.assets.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-zinc-400 text-sm mb-2 font-medium">还没有素材</p>
            <p className="text-zinc-600 text-xs mb-6">上传产品图，AI 主动为你生成全套广告创意</p>
            <a
              href="/get"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm px-6 py-2.5 rounded-lg font-medium transition"
            >
              <Sparkles className="w-4 h-4" />
              开始生成
            </a>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            该筛选条件下没有素材
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredAssets.map((asset, idx) => (
              <div
                key={asset.id}
                onClick={() => setPreviewIndex(idx)}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-violet-500/40 transition-all cursor-pointer"
              >
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  <img
                    src={asset.imageUrl}
                    alt={asset.sceneLabel}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* 水印 */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                    <span className="text-white/[0.07] text-2xl font-black tracking-widest -rotate-12">100x</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      预览
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        (async () => {
                          try {
                            const consumeRes = await fetch('/api/quota/consume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) });
                            if (!consumeRes.ok) {
                              const err = await consumeRes.json().catch(() => ({}));
                              alert(err.error || '下载失败');
                              return;
                            }
                            const a = document.createElement('a');
                            a.href = asset.imageUrl;
                            a.download = `${asset.brandName}-${asset.sceneLabel}.png`;
                            a.click();
                          } catch { alert('下载出错'); }
                        })();
                      }}
                      className="bg-violet-600/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-violet-500 transition"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                      className="bg-zinc-800/80 backdrop-blur-sm text-zinc-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  </div>
                  {/* Platform badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/60 backdrop-blur-sm text-[10px] text-zinc-300 px-2 py-0.5 rounded-md font-medium">
                      {asset.aspectRatio}
                    </span>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-medium text-zinc-300 truncate">{asset.brandName}</div>
                  <div className="text-[11px] text-zinc-600 truncate">{asset.sceneLabel} · {asset.platform}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {userData?.assets && userData.assets.length > 0 && (
          <div className="mt-8 text-center">
            <a href="/get"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-violet-400 transition group">
              <Sparkles className="w-4 h-4" />
              AI 主动推荐新素材，继续生成
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
