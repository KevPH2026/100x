'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Download, LogOut, Zap, ChevronRight, LayoutGrid,
  X, ChevronLeft, ChevronRight as ChevronRightIcon, Filter, Sparkles,
  Brain, Wand2, Lightbulb, ArrowRight, Eye, Trash2,
  Palette, Settings, BarChart3, Heart, PenLine, Plus, Store
} from 'lucide-react';

// ─── 类型 ────────────────────────────────────────────────────
interface Asset {
  id: string; imageUrl: string; brandName: string; platform: string;
  sceneLabel: string; aspectRatio: string; headline: string | null; createdAt: string;
}
interface UserData {
  id: string; email: string; name: string;
  quotaTotal: number; quotaUsed: number; quotaRemaining: number; assets: Asset[];
}
interface UserMemory {
  id: string; category: string; key: string; value: string; source: string | null; confidence: number;
}
interface UserBrand {
  id: string; brandName: string; industry: string | null; style: string | null;
  targetAudience: string | null; colorPalette: any; logoUrl: string | null;
  notes: string | null; usageCount: number; lastUsedAt: string; createdAt: string;
}
interface Insight {
  type: string; label: string; value: string; confidence: number;
}

type TabKey = 'assets' | 'brands' | 'insights' | 'preferences';

const PLATFORM_FILTERS = [
  { key: 'all', label: '全部', icon: LayoutGrid },
  { key: 'IG Feed', label: 'IG Feed', short: '1:1' },
  { key: 'Story', label: 'Story', short: '9:16' },
  { key: 'TikTok', label: 'TikTok', short: '9:16' },
  { key: 'FB', label: 'Facebook', short: '16:9' },
  { key: 'Pinterest', label: 'Pinterest', short: '2:3' },
];

const TABS: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: 'assets', label: '素材库', icon: LayoutGrid },
  { key: 'brands', label: '品牌档案', icon: Store },
  { key: 'insights', label: 'AI 洞察', icon: Brain },
  { key: 'preferences', label: '偏好设置', icon: Settings },
];

const STYLE_OPTIONS = ['极简', '奢华', '活泼', '科技', '自然', '复古', '潮酷', '温暖'];
const INDUSTRY_OPTIONS = ['美妆', '3C数码', '服饰', '食品饮料', '家居', '母婴', '运动健身', '其他'];

function getBrands(assets: Asset[]): string[] {
  return Array.from(new Set(assets.map(a => a.brandName))).sort();
}

// ─── 图片预览 Modal ─────────────────────────────────────────
function ImagePreview({ asset, onClose, onPrev, onNext, hasPrev, hasNext, onDelete }: {
  asset: Asset; onClose: () => void; onPrev: () => void; onNext: () => void;
  hasPrev: boolean; hasNext: boolean; onDelete: () => void;
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-10 max-w-4xl w-full mx-4 flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 text-[rgba(250,250,250,.6)] hover:text-[#fafafa] transition p-2">
          <X className="w-5 h-5" />
        </button>
        <div className="bg-[rgba(255,255,255,.03)] rounded-2xl overflow-hidden border border-[rgba(255,255,255,.06)] shadow-2xl">
          <div className="flex items-center justify-center bg-[#09090b] min-h-[300px] max-h-[70vh] relative">
            <img src={asset.imageUrl} alt={asset.sceneLabel} className="max-w-full max-h-[70vh] object-contain" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
              <span className="text-white/10 text-5xl font-black tracking-widest -rotate-12">100x</span>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[rgba(255,255,255,.06)] flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#fafafa] text-sm">{asset.brandName}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-[rgba(250,250,250,.6)]">{asset.sceneLabel}</span>
                <span className="text-xs text-[rgba(250,250,250,.35)]">·</span>
                <span className="text-xs text-[rgba(250,250,250,.6)]">{asset.platform}</span>
                <span className="text-xs text-[rgba(250,250,250,.35)]">·</span>
                <span className="text-xs text-[rgba(250,250,250,.6)]">{asset.aspectRatio}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[rgba(250,250,250,.35)]">{new Date(asset.createdAt).toLocaleDateString('zh-CN')}</span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-1.5 bg-[rgba(255,255,255,.05)] hover:bg-red-600 text-[rgba(250,250,250,.6)] hover:text-[#fafafa] text-xs px-4 py-2 rounded-lg transition">
                <Trash2 className="w-3.5 h-3.5" />删除
              </button>
              <button onClick={(e) => { e.stopPropagation(); (async () => {
                try {
                  const cr = await fetch('/api/quota/consume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) });
                  if (!cr.ok) { const err = await cr.json().catch(() => ({})); alert(err.error || '下载失败'); return; }
                  const a = document.createElement('a'); a.href = asset.imageUrl; a.download = `${asset.brandName}-${asset.sceneLabel}.png`; a.click();
                } catch { alert('下载出错'); }
              })(); }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#f97316] to-[#ec4899] hover:from-[#fb923c] hover:to-[#f472b6] text-[#fafafa] text-xs px-4 py-2 rounded-lg transition">
                <Download className="w-3.5 h-3.5" />下载（扣1配额）
              </button>
            </div>
          </div>
        </div>
        {hasPrev && <button onClick={onPrev} className="absolute left-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(255,255,255,.05)]/80 border border-[rgba(255,255,255,.1)] flex items-center justify-center text-[rgba(250,250,250,.6)] hover:text-[#fafafa] hover:bg-[rgba(255,255,255,.08)] transition"><ChevronLeft className="w-5 h-5" /></button>}
        {hasNext && <button onClick={onNext} className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(255,255,255,.05)]/80 border border-[rgba(255,255,255,.1)] flex items-center justify-center text-[rgba(250,250,250,.6)] hover:text-[#fafafa] hover:bg-[rgba(255,255,255,.08)] transition"><ChevronRightIcon className="w-5 h-5" /></button>}
      </div>
    </div>
  );
}

// ─── 主页面 ─────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('assets');

  // 素材筛选
  const [platformFilter, setPlatformFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // 品牌档案 & 偏好 & 洞察
  const [brands, setBrands] = useState<UserBrand[]>([]);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightStats, setInsightStats] = useState<any>(null);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [showNewBrand, setShowNewBrand] = useState(false);

  // 新品牌表单
  const [brandForm, setBrandForm] = useState({ brandName: '', industry: '', style: '', targetAudience: '', notes: '' });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/user/me').then(r => r.json()),
        fetch('/api/user/memory').then(r => r.json()),
        fetch('/api/user/insights').then(r => r.json()),
      ]).then(([ud, mem, ins]) => {
        setUserData(ud);
        setBrands(mem.brands || []);
        setMemories(mem.memories || []);
        setInsights(ins.insights || []);
        setInsightStats(ins.stats || null);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

  const filteredAssets = useMemo(() => {
    if (!userData?.assets) return [];
    let list = userData.assets;
    if (platformFilter !== 'all') list = list.filter(a => a.platform.includes(platformFilter));
    if (brandFilter !== 'all') list = list.filter(a => a.brandName === brandFilter);
    return list;
  }, [userData?.assets, platformFilter, brandFilter]);

  const assetBrands = useMemo(() => getBrands(userData?.assets || []), [userData?.assets]);

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#ec4899] border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!session) return null;

  const quotaPercent = userData ? Math.round((userData.quotaUsed / Math.max(userData.quotaTotal, 1)) * 100) : 0;
  const previewAsset = previewIndex !== null ? filteredAssets[previewIndex] : null;

  const deleteAsset = async (assetId: string) => {
    if (!confirm('确定要删除？')) return;
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUserData(prev => prev ? { ...prev, assets: prev.assets.filter(a => a.id !== assetId), quotaUsed: Math.max(0, prev.quotaUsed - 1), quotaRemaining: prev.quotaRemaining + 1 } : prev);
      setPreviewIndex(null);
    } catch { alert('删除失败'); }
  };

  const saveBrand = async () => {
    if (!brandForm.brandName) return;
    const res = await fetch('/api/user/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandForm),
    });
    if (res.ok) {
      const data = await res.json();
      setBrands(prev => {
        const idx = prev.findIndex(b => b.brandName === brandForm.brandName);
        if (idx >= 0) { const n = [...prev]; n[idx] = data.brand; return n; }
        return [...prev, data.brand];
      });
      setBrandForm({ brandName: '', industry: '', style: '', targetAudience: '', notes: '' });
      setShowNewBrand(false);
      setEditingBrand(null);
    }
  };

  const saveMemory = async (category: string, key: string, value: string) => {
    const res = await fetch('/api/user/memory', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, key, value, source: 'manual' }),
    });
    if (res.ok) {
      const data = await res.json();
      setMemories(prev => {
        const idx = prev.findIndex(m => m.category === category && m.key === key);
        if (idx >= 0) { const n = [...prev]; n[idx] = data.memory; return n; }
        return [...prev, data.memory];
      });
    }
  };

  const deleteMemory = async (id: string) => {
    await fetch(`/api/user/memory?id=${id}`, { method: 'DELETE' });
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // ─── 渲染 ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {previewAsset && (() => {
        const pi = previewIndex as number;
        return <ImagePreview asset={previewAsset} onClose={() => setPreviewIndex(null)} onPrev={() => pi > 0 && setPreviewIndex(pi - 1)} onNext={() => pi < filteredAssets.length - 1 && setPreviewIndex(pi + 1)} hasPrev={pi > 0} hasNext={pi < filteredAssets.length - 1} onDelete={() => deleteAsset(previewAsset.id)} />;
      })()}

      {/* Nav */}
      <nav className="border-b border-[rgba(255,255,255,.06)] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-xl z-40">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="100x" className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-[#f97316] via-[#ec4899] to-[#8b5cf6] bg-clip-text text-transparent">100x</span>
          <span className="text-xs text-[rgba(250,250,250,.35)] hidden sm:block">创意中心</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/get" className="flex items-center gap-1.5 bg-gradient-to-r from-[#f97316] to-[#ec4899] hover:from-[#fb923c] hover:to-[#f472b6] text-[#fafafa] text-sm px-4 py-2 rounded-lg transition font-medium">
            <Sparkles className="w-3.5 h-3.5" />生成素材
          </a>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-1.5 text-sm text-[rgba(250,250,250,.35)] hover:text-[rgba(250,250,250,.6)] transition-colors">
            <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">退出</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#8b5cf6] flex items-center justify-center text-xl font-bold shrink-0 text-white">
              {(userData?.name || session.user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#fafafa]">{userData?.name || '我的账户'}</h1>
              <p className="text-[rgba(250,250,250,.35)] text-sm">{session.user?.email}</p>
            </div>
          </div>
          <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl px-5 py-3 flex items-center gap-4 min-w-[280px]">
            <Zap className="w-4 h-4 text-[#f97316] shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[rgba(250,250,250,.6)]">配额</span>
                <span className="text-xs font-mono">
                  <span className="text-[#fafafa] font-semibold">{userData?.quotaUsed ?? 0}</span>
                  <span className="text-[rgba(250,250,250,.35)]"> / {userData?.quotaTotal ?? 0}</span>
                </span>
              </div>
              <div className="h-2 bg-[rgba(255,255,255,.06)] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] via-[#ec4899] to-[#8b5cf6] transition-all duration-700 shadow-[0_0_10px_rgba(249,115,22,0.3)]" style={{ width: `${Math.min(quotaPercent, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-4 text-center hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f97316] to-[#fb923c]" />
            <div className="text-2xl font-bold text-[#fafafa]">{userData?.assets?.length ?? 0}</div>
            <div className="text-xs text-[rgba(250,250,250,.35)] mt-1">素材</div>
          </div>
          <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-4 text-center hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ec4899] to-[#f472b6]" />
            <div className="text-2xl font-bold text-[#fafafa]">{brands.length}</div>
            <div className="text-xs text-[rgba(250,250,250,.35)] mt-1">品牌</div>
          </div>
          <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-4 text-center hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]" />
            <div className="text-2xl font-bold text-[#fafafa]">{insights.filter(i => i.type === 'pattern').length}</div>
            <div className="text-xs text-[rgba(250,250,250,.35)] mt-1">AI 识别偏好</div>
          </div>
          <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-4 text-center hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#06b6d4] to-[#22d3ee]" />
            <div className="text-2xl font-bold text-[#fafafa]">{userData?.quotaRemaining ?? 0}</div>
            <div className="text-xs text-[rgba(250,250,250,.35)] mt-1">剩余配额</div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[rgba(255,255,255,.06)] mb-6">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-0 text-[#fafafa] relative'
                    : 'border-transparent text-[rgba(250,250,250,.35)] hover:text-[rgba(250,250,250,.6)]'
                }`}>
                {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f97316] to-[#ec4899]" />}
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab: 素材库 ────────────────────────────────── */}
        {activeTab === 'assets' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-[rgba(250,250,250,.35)]" /><span className="text-xs text-[rgba(250,250,250,.35)] font-medium">筛选</span></div>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setPlatformFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${platformFilter === f.key ? 'bg-gradient-to-r from-[#f97316] to-[#ec4899] text-white shadow-sm shadow-[#f97316]/20' : 'bg-[rgba(255,255,255,.03)] text-[rgba(250,250,250,.6)] hover:text-[#fafafa] border border-[rgba(255,255,255,.06)]'}`}>
                    {f.label}{f.short && <span className="ml-1 text-[rgba(250,250,250,.35)] font-mono">{f.short}</span>}
                  </button>
                ))}
              </div>
              {assetBrands.length > 1 && (
                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
                  className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] text-[rgba(250,250,250,.6)] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#f97316] ml-auto">
                  <option value="all">全部品牌</option>
                  {assetBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
            </div>

            {!userData?.assets || userData.assets.length === 0 ? (
              <div className="border border-dashed border-[rgba(255,255,255,.06)] rounded-xl p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(249,115,22,.08)] border border-[rgba(249,115,22,.15)] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#f97316]/10"><Sparkles className="w-7 h-7 text-[#f97316]" /></div>
                <p className="text-[rgba(250,250,250,.6)] text-sm mb-2 font-medium">还没有素材</p>
                <p className="text-[rgba(250,250,250,.35)] text-xs mb-6">上传产品图，AI 主动为你生成全套广告创意</p>
                <a href="/get" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f97316] to-[#ec4899] hover:from-[#fb923c] hover:to-[#f472b6] text-white text-sm px-6 py-2.5 rounded-lg font-medium transition"><Sparkles className="w-4 h-4" />开始生成</a>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-12 text-[rgba(250,250,250,.35)] text-sm">该筛选条件下没有素材</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredAssets.map((asset, idx) => (
                  <div key={asset.id} onClick={() => setPreviewIndex(idx)}
                    className="group relative bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl overflow-hidden hover:border-[rgba(236,72,153,.3)] transition-all cursor-pointer hover:shadow-xl hover:shadow-[rgba(236,72,153,.08)]">
                    <div className="aspect-square bg-[rgba(255,255,255,.02)] relative overflow-hidden">
                      <img src={asset.imageUrl} alt={asset.sceneLabel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                        <span className="text-white/[0.07] text-2xl font-black tracking-widest -rotate-12">100x</span>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#fafafa] text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Eye className="w-3 h-3" />预览</span>
                        <button onClick={e => { e.stopPropagation(); (async () => {
                          try {
                            const cr = await fetch('/api/quota/consume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) });
                            if (!cr.ok) { const err = await cr.json().catch(() => ({})); alert(err.error || '下载失败'); return; }
                            const a = document.createElement('a'); a.href = asset.imageUrl; a.download = `${asset.brandName}-${asset.sceneLabel}.png`; a.click();
                          } catch { alert('下载出错'); }
                        })(); }}
                          className="bg-gradient-to-r from-[#f97316] to-[#ec4899]/80 backdrop-blur-sm text-[#fafafa] text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:from-[#fb923c] hover:to-[#f472b6] transition"><Download className="w-3 h-3" />下载</button>
                        <button onClick={e => { e.stopPropagation(); deleteAsset(asset.id); }}
                          className="bg-[rgba(255,255,255,.05)] backdrop-blur-sm text-[rgba(250,250,250,.6)] text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-600 hover:text-[#fafafa] transition"><Trash2 className="w-3 h-3" />删除</button>
                      </div>
                      <div className="absolute top-2 left-2"><span className="bg-black/60 backdrop-blur-sm text-[10px] text-[rgba(250,250,250,.6)] px-2 py-0.5 rounded-md font-medium">{asset.aspectRatio}</span></div>
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs font-medium text-[rgba(250,250,250,.85)] truncate">{asset.brandName}</div>
                      <div className="text-[11px] text-[rgba(250,250,250,.35)] truncate">{asset.sceneLabel} · {asset.platform}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {userData?.assets && userData.assets.length > 0 && (
              <div className="mt-8 text-center">
                <a href="/get" className="inline-flex items-center gap-2 text-sm text-[rgba(250,250,250,.6)] hover:text-[#ec4899] transition group">
                  <Sparkles className="w-4 h-4" />继续生成<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            )}
          </>
        )}

        {/* ── Tab: 品牌档案 ─────────────────────────────── */}
        {activeTab === 'brands' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-[#fafafa]">品牌档案</h2>
                <p className="text-xs text-[rgba(250,250,250,.35)] mt-1">AI 记住你的每个品牌，下次生成时自动注入偏好</p>
              </div>
              <button onClick={() => { setShowNewBrand(true); setEditingBrand(null); setBrandForm({ brandName: '', industry: '', style: '', targetAudience: '', notes: '' }); }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#f97316] to-[#ec4899] hover:from-[#fb923c] hover:to-[#f472b6] text-[#fafafa] text-xs px-4 py-2 rounded-lg transition font-medium">
                <Plus className="w-3.5 h-3.5" />添加品牌
              </button>
            </div>

            {/* 新建/编辑表单 */}
            {showNewBrand && (
              <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-6 mb-6">
                <h3 className="text-sm font-semibold mb-4 text-[#fafafa]">{editingBrand ? '编辑品牌' : '添加品牌'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[rgba(250,250,250,.6)] block mb-1.5">品牌名 *</label>
                    <input value={brandForm.brandName} onChange={e => setBrandForm(p => ({ ...p, brandName: e.target.value }))}
                      disabled={!!editingBrand}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-sm text-[#fafafa] focus:outline-none focus:border-[#f97316] disabled:opacity-50 placeholder-[rgba(250,250,250,.25)]" placeholder="GlowSkin" />
                  </div>
                  <div>
                    <label className="text-xs text-[rgba(250,250,250,.6)] block mb-1.5">行业</label>
                    <select value={brandForm.industry} onChange={e => setBrandForm(p => ({ ...p, industry: e.target.value }))}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-sm text-[#fafafa] focus:outline-none focus:border-[#f97316]">
                      <option value="">选择行业</option>
                      {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[rgba(250,250,250,.6)] block mb-1.5">品牌风格</label>
                    <select value={brandForm.style} onChange={e => setBrandForm(p => ({ ...p, style: e.target.value }))}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-sm text-[#fafafa] focus:outline-none focus:border-[#f97316]">
                      <option value="">选择风格</option>
                      {STYLE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[rgba(250,250,250,.6)] block mb-1.5">目标人群</label>
                    <input value={brandForm.targetAudience} onChange={e => setBrandForm(p => ({ ...p, targetAudience: e.target.value }))}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-sm text-[#fafafa] focus:outline-none focus:border-[#f97316] placeholder-[rgba(250,250,250,.25)]" placeholder="25-35岁都市女性" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[rgba(250,250,250,.6)] block mb-1.5">备注</label>
                    <textarea value={brandForm.notes} onChange={e => setBrandForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-sm text-[#fafafa] focus:outline-none focus:border-[#f97316] h-20 resize-none placeholder-[rgba(250,250,250,.25)]" placeholder="品牌调性、用色偏好等..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => { setShowNewBrand(false); setEditingBrand(null); }} className="text-xs text-[rgba(250,250,250,.6)] hover:text-[#fafafa] px-4 py-2">取消</button>
                  <button onClick={saveBrand} className="bg-gradient-to-r from-[#f97316] to-[#ec4899] hover:from-[#fb923c] hover:to-[#f472b6] text-[#fafafa] text-xs px-4 py-2 rounded-lg transition font-medium">保存</button>
                </div>
              </div>
            )}

            {/* 品牌列表 */}
            {brands.length === 0 && !showNewBrand ? (
              <div className="border border-dashed border-[rgba(255,255,255,.06)] rounded-xl p-12 text-center">
                <Store className="w-8 h-8 text-[rgba(250,250,250,.25)] mx-auto mb-3" />
                <p className="text-[rgba(250,250,250,.6)] text-sm">还没有品牌档案</p>
                <p className="text-[rgba(250,250,250,.35)] text-xs mt-1">添加品牌信息，AI 会记住并在生成时自动应用</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brands.map(brand => (
                  <div key={brand.id} className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-5 hover:border-[rgba(236,72,153,.2)] transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#fafafa]">{brand.brandName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {brand.industry && <span className="text-[10px] bg-[rgba(249,115,22,.08)] text-[#f97316] px-2 py-0.5 rounded-md">{brand.industry}</span>}
                          {brand.style && <span className="text-[10px] bg-[rgba(139,92,246,.08)] text-[#8b5cf6] px-2 py-0.5 rounded-md">{brand.style}</span>}
                        </div>
                      </div>
                      <button onClick={() => { setShowNewBrand(true); setEditingBrand(brand.brandName); setBrandForm({ brandName: brand.brandName, industry: brand.industry || '', style: brand.style || '', targetAudience: brand.targetAudience || '', notes: brand.notes || '' }); }}
                        className="text-[rgba(250,250,250,.35)] hover:text-[#ec4899] transition"><PenLine className="w-4 h-4" /></button>
                    </div>
                    {brand.targetAudience && <p className="text-xs text-[rgba(250,250,250,.6)] mb-2">🎯 {brand.targetAudience}</p>}
                    {brand.notes && <p className="text-xs text-[rgba(250,250,250,.35)] mb-2">{brand.notes}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-[rgba(250,250,250,.25)]">
                      <span>生成 {brand.usageCount} 次</span>
                      <span>·</span>
                      <span>最近 {new Date(brand.lastUsedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: AI 洞察 ─────────────────────────────── */}
        {activeTab === 'insights' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#fafafa]">AI 对你的了解</h2>
                <p className="text-xs text-[rgba(250,250,250,.35)] mt-0.5">基于你的使用行为自动分析，每次生成都会学习</p>
              </div>
            </div>

            {insights.length === 0 ? (
              <div className="border border-dashed border-[rgba(255,255,255,.06)] rounded-xl p-12 text-center">
                <Brain className="w-8 h-8 text-[rgba(250,250,250,.25)] mx-auto mb-3" />
                <p className="text-[rgba(250,250,250,.6)] text-sm">AI 还在学习中</p>
                <p className="text-[rgba(250,250,250,.35)] text-xs mt-1">多生成一些素材，AI 就能识别你的偏好</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.map((ins, idx) => {
                  const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
                    pattern: { icon: BarChart3, color: 'orange', label: '行为模式' },
                    insight: { icon: Lightbulb, color: 'pink', label: '洞察' },
                    suggestion: { icon: Wand2, color: 'purple', label: '建议' },
                  };
                  const cfg = typeConfig[ins.type] || typeConfig.insight;
                  const Icon = cfg.icon;
                  const colorMap: Record<string, string> = {
                    orange: 'border-[rgba(249,115,22,.15)] bg-[rgba(249,115,22,.04)]',
                    pink: 'border-[rgba(236,72,153,.15)] bg-[rgba(236,72,153,.04)]',
                    purple: 'border-[rgba(139,92,246,.15)] bg-[rgba(139,92,246,.04)]',
                  };
                  const iconColorMap: Record<string, string> = {
                    orange: 'text-[#f97316]',
                    pink: 'text-[#ec4899]',
                    purple: 'text-[#8b5cf6]',
                  };
                  const barColorMap: Record<string, string> = {
                    orange: 'from-[#f97316] to-[#fb923c]',
                    pink: 'from-[#ec4899] to-[#f472b6]',
                    purple: 'from-[#8b5cf6] to-[#a78bfa]',
                  };
                  const confPercent = Math.round(ins.confidence * 100);
                  return (
                    <div key={idx} className={`border ${colorMap[cfg.color] || 'border-[rgba(255,255,255,.06)]'} rounded-xl p-5`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${iconColorMap[cfg.color] || 'text-[rgba(250,250,250,.6)]'}`} />
                        <span className="text-[10px] text-[rgba(250,250,250,.35)] uppercase tracking-wider font-semibold">{cfg.label}</span>
                        <span className="ml-auto text-[10px] text-[rgba(250,250,250,.25)]">置信度 {confPercent}%</span>
                      </div>
                      <div className="text-xs text-[rgba(250,250,250,.6)] mb-1">{ins.label}</div>
                      <div className="text-sm font-medium text-[#fafafa]">{ins.value}</div>
                      {/* 置信度条 */}
                      <div className="h-1 bg-[rgba(255,255,255,.06)] rounded-full mt-3 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${barColorMap[cfg.color] || 'from-[#8b5cf6] to-[#06b6d4]'} transition-all`} style={{ width: `${confPercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 分布图 */}
            {insightStats?.platformDistribution && Object.keys(insightStats.platformDistribution).length > 0 && (
              <div className="mt-6 bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-4 text-[#fafafa]">平台分布</h3>
                <div className="space-y-3">
                  {Object.entries(insightStats.platformDistribution as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([platform, count], i) => {
                    const max = Math.max(...Object.values(insightStats.platformDistribution as Record<string, number>));
                    const pct = Math.round((count / max) * 100);
                    const barColors = ['from-[#f97316] to-[#fb923c]', 'from-[#ec4899] to-[#f472b6]', 'from-[#8b5cf6] to-[#a78bfa]', 'from-[#06b6d4] to-[#22d3ee]'];
                    return (
                      <div key={platform} className="flex items-center gap-3">
                        <span className="text-xs text-[rgba(250,250,250,.6)] w-28 shrink-0 truncate">{platform}</span>
                        <div className="flex-1 h-2 bg-[rgba(255,255,255,.06)] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${barColors[i % barColors.length]} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[rgba(250,250,250,.35)] w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 偏好设置 ─────────────────────────────── */}
        {activeTab === 'preferences' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#fafafa]">偏好设置</h2>
                <p className="text-xs text-[rgba(250,250,250,.35)] mt-0.5">告诉 AI 你的喜好，生成结果会更精准</p>
              </div>
            </div>

            {/* 预设偏好项 */}
            <PreferenceSection title="视觉风格" description="你偏好什么风格的素材？" category="style" memories={memories} onSave={saveMemory} onDelete={deleteMemory}
              presets={[
                { key: 'color_tone', label: '色调偏好', placeholder: '如：冷色调、暖色调、黑白、高饱和' },
                { key: 'photography_style', label: '摄影风格', placeholder: '如：棚拍、自然光、街拍、生活方式' },
                { key: 'composition', label: '构图偏好', placeholder: '如：居中构图、三分法、留白多' },
              ]} />

            <PreferenceSection title="投放偏好" description="你通常在哪些平台投放？" category="distribution" memories={memories} onSave={saveMemory} onDelete={deleteMemory}
              presets={[
                { key: 'primary_platform', label: '主力平台', placeholder: '如：Instagram、TikTok、Facebook' },
                { key: 'target_market', label: '目标市场', placeholder: '如：北美、欧洲、东南亚、全球' },
                { key: 'language', label: '素材语言', placeholder: '如：英文、中文、双语' },
              ]} />

            <PreferenceSection title="品牌调性" description="你的品牌是什么性格？" category="brand_tone" memories={memories} onSave={saveMemory} onDelete={deleteMemory}
              presets={[
                { key: 'tone', label: '品牌语气', placeholder: '如：专业权威、亲切友好、高端奢华' },
                { key: 'audience_age', label: '受众年龄段', placeholder: '如：18-25、25-35、35-50' },
                { key: 'cta_style', label: 'CTA 风格', placeholder: '如：立即购买、了解更多、限时优惠' },
              ]} />

            {/* 自定义偏好 */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[rgba(250,250,250,.85)] mb-3">其他偏好</h3>
              {memories.filter(m => !['style', 'distribution', 'brand_tone'].includes(m.category)).map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-lg px-4 py-3 mb-2">
                  <span className="text-xs text-[rgba(250,250,250,.35)]">{m.category}/{m.key}</span>
                  <span className="text-sm text-[#fafafa] flex-1">{m.value}</span>
                  <button onClick={() => deleteMemory(m.id)} className="text-[rgba(250,250,250,.35)] hover:text-red-400 transition"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <CustomPrefForm onSave={(cat, key, val) => saveMemory(cat, key, val)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 偏好区块组件 ────────────────────────────────────────────
function PreferenceSection({ title, description, category, memories, onSave, onDelete, presets }: {
  title: string; description: string; category: string;
  memories: UserMemory[]; onSave: (c: string, k: string, v: string) => void; onDelete: (id: string) => void;
  presets: Array<{ key: string; label: string; placeholder: string }>;
}) {
  return (
    <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-6 mb-4">
      <h3 className="text-sm font-semibold mb-1 text-[#fafafa]">{title}</h3>
      <p className="text-xs text-[rgba(250,250,250,.35)] mb-4">{description}</p>
      <div className="space-y-3">
        {presets.map(p => {
          const existing = memories.find(m => m.category === category && m.key === p.key);
          return (
            <div key={p.key} className="flex items-center gap-3">
              <label className="text-xs text-[rgba(250,250,250,.6)] w-24 shrink-0">{p.label}</label>
              <input
                defaultValue={existing?.value || ''}
                placeholder={p.placeholder}
                onBlur={e => { if (e.target.value.trim()) onSave(category, p.key, e.target.value.trim()); }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) onSave(category, p.key, (e.target as HTMLInputElement).value.trim()); }}
                className="flex-1 bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-sm text-[#fafafa] placeholder-[rgba(250,250,250,.25)] focus:outline-none focus:border-[#f97316]"
              />
              {existing && (
                <button onClick={() => onDelete(existing.id)} className="text-[rgba(250,250,250,.35)] hover:text-red-400 transition"><X className="w-3.5 h-3.5" /></button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomPrefForm({ onSave }: { onSave: (c: string, k: string, v: string) => void }) {
  const [cat, setCat] = useState('');
  const [key, setKey] = useState('');
  const [val, setVal] = useState('');
  return (
    <div className="flex items-center gap-2 mt-3">
      <input value={cat} onChange={e => setCat(e.target.value)} placeholder="分类" className="bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-xs text-[#fafafa] placeholder-[rgba(250,250,250,.25)] focus:outline-none focus:border-[#f97316] w-24" />
      <input value={key} onChange={e => setKey(e.target.value)} placeholder="键名" className="bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-xs text-[#fafafa] placeholder-[rgba(250,250,250,.25)] focus:outline-none focus:border-[#f97316] w-28" />
      <input value={val} onChange={e => setVal(e.target.value)} placeholder="值" className="flex-1 bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.1)] rounded-lg px-3 py-2 text-xs text-[#fafafa] placeholder-[rgba(250,250,250,.25)] focus:outline-none focus:border-[#f97316]" />
      <button onClick={() => { if (cat && key && val) { onSave(cat, key, val); setCat(''); setKey(''); setVal(''); } }}
        className="bg-gradient-to-r from-[#f97316] to-[#ec4899] hover:from-[#fb923c] hover:to-[#f472b6] text-[#fafafa] text-xs px-3 py-2 rounded-lg transition shrink-0">添加</button>
    </div>
  );
}
