'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, Image as ImageIcon, Ticket, Settings,
  Search, Copy, Trash2, Plus, ChevronLeft, ChevronRight,
  Lock, Check, X, AlertCircle, RefreshCw, Eye, GitBranch,
  Save, RotateCcw, ChevronDown, ChevronUp, Ghost, FileText,
  Activity, MessageSquare, Workflow, ClipboardList,
  Calendar, Clock, TrendingUp,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────
interface Stats {
  totalUsers: number; activeUsers: number; totalAssets: number;
  todayAssets: number; avgPerUser: number; quotaUsageRate: number;
  dailyGenerations: { date: string; count: number }[];
}

interface AdminUser {
  id: string; email: string; name: string | null;
  company: string | null; phone: string | null;
  quotaTotal: number; quotaUsed: number; disabled: boolean;
  createdAt: string; _count: { assets: number };
  expiresAt: string | null;
}

interface AdminAsset {
  id: string; imageUrl: string; brandName: string; platform: string;
  sceneLabel: string; aspectRatio: string; createdAt: string;
  user: { email: string; name: string | null };
}

interface InviteRow {
  id: string; code: string; quota: number; note: string | null;
  usedAt: string | null; createdAt: string;
  usedBy: { email: string } | null;
  validDays: number | null;
}

// ─── Main ───────────────────────────────────────────────────────
const TABS = [
  { key: 'dashboard', label: '概览', icon: BarChart3 },
  { key: 'users', label: '用户', icon: Users },
  { key: 'guests', label: '游客', icon: Ghost },
  { key: 'generations', label: '生成日志', icon: FileText },
  { key: 'assets', label: '素材库', icon: ImageIcon },
  { key: 'invites', label: '邀请码', icon: Ticket },
  { key: 'workflows', label: '工作流', icon: GitBranch },
  { key: 'health', label: '模型监测', icon: Activity },
  { key: 'feedbacks', label: '用户反馈', icon: MessageSquare },
  { key: 'traces', label: '交互追踪', icon: ClipboardList },
  { key: 'analytics', label: '访问统计', icon: TrendingUp },
  { key: 'settings', label: '配置', icon: Settings },
] as const;
type TabKey = typeof TABS[number]['key'];

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('dashboard');

  // auth
  useEffect(() => {
    const c = document.cookie.split('; ').find(r => r.startsWith('admin_token='));
    if (c) {
      const t = c.split('=')[1];
      setToken(t);
      setAuthenticated(true);
    }
  }, []);

  const login = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '登录失败'); return; }
      document.cookie = `admin_token=${data.token}; path=/; max-age=86400`;
      setToken(data.token);
      setAuthenticated(true);
    } catch { setError('网络错误'); }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-80 space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">100x Admin</h1>
            <p className="text-zinc-500 text-sm mt-1">运营后台</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="管理员密码" className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none focus:border-violet-500" />
            {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
            <button onClick={login} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition">
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-52 border-r border-zinc-800 bg-zinc-900/50 flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-zinc-800">
          <h1 className="text-base font-bold text-white">100x</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">运营后台</p>
        </div>
        <nav className="flex-1 py-2">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm transition ${tab === t.key ? 'text-white bg-zinc-800 border-r-2 border-violet-500' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-zinc-800">
          <button onClick={() => { document.cookie = 'admin_token=; path=/; max-age=0'; setAuthenticated(false); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition">退出登录</button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'guests' && <GuestsTab />}
          {tab === 'generations' && <GenerationsTab />}
          {tab === 'assets' && <AssetsTab />}
          {tab === 'invites' && <InvitesTab />}
          {tab === 'workflows' && <WorkflowsTab />}
          {tab === 'health' && <ModelHealthTab />}
          {tab === 'feedbacks' && <FeedbacksTab />}
          {tab === 'traces' && <TracesTab />}
          {tab === 'analytics' && <AnalyticsTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const sr = stats?.successRate ?? 100;
  const srGradient = sr >= 85 ? 'from-emerald-600 to-teal-700' : sr >= 70 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600';
  const gradCards = [
    { label: '总用户', value: stats?.totalUsers ?? 0, sub: `今日活跃 ${(stats?.activeUsers ?? 0)}`, gradient: 'from-violet-600 to-purple-700' },
    { label: '今日生成', value: stats?.todayGenLogs ?? 0, sub: `总素材 ${stats?.totalAssets ?? 0}`, gradient: 'from-blue-600 to-indigo-700' },
    { label: '今日访客', value: stats?.todayGuests ?? 0, sub: `累计 ${stats?.totalGuests ?? 0}`, gradient: 'from-emerald-600 to-teal-700' },
    { label: '成功率', value: `${sr}%`, sub: `近7天共 ${stats?.totalGen ?? 0} 次`, gradient: srGradient },
  ];

  // 模型状态
  const models = stats?.modelStats ? Object.entries(stats.modelStats as Record<string, any>) : [];

  // 平台分布
  const platforms = stats?.platformDist || [];
  const totalPlat = platforms.reduce((s: number, p: any) => s + p.count, 0) || 1;

  // 最近活动
  const recentLogs = stats?.recentLogs || [];
  const topBrands = stats?.topBrands || [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">驾驶舱</h2>

      {/* ── 渐变Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gradCards.map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-5 text-white shadow-lg`}>
            <p className="text-xs text-white/70 mb-1">{c.label}</p>
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-[11px] text-white/60 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── 模型实时状态 ── */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            模型状态
          </h3>
          <div className="space-y-3">
            {models.length === 0 && <p className="text-xs text-zinc-600">暂无数据</p>}
            {models.map(([name, m]: [string, any]) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.lastOk ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-zinc-300 truncate">{name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-mono ${m.lastLatency < 3000 ? 'text-emerald-400' : m.lastLatency < 15000 ? 'text-amber-400' : 'text-red-400'}`}>
                    {m.lastLatency < 1000 ? `${m.lastLatency}ms` : `${(m.lastLatency/1000).toFixed(1)}s`}
                  </span>
                  <span className="text-[10px] text-zinc-500">{m.ok}/{m.ok + m.fail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 近7天生成量 + 平台分布 ── */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-4">近7天生成量</h3>
          <div className="flex items-end gap-2 h-28 mb-6">
            {(stats?.dailyGenerations ?? []).map((d: any) => {
              const max = Math.max(...(stats?.dailyGenerations?.map((x: any) => x.count) || [1]), 1);
              const h = Math.max(4, (d.count / max) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-500">{d.count}</span>
                  <div className="w-full bg-violet-600/80 rounded-t" style={{ height: `${h}%` }} />
                  <span className="text-[10px] text-zinc-600">{d.date.slice(5,10)}</span>
                </div>
              );
            })}
          </div>

          <h3 className="text-xs font-semibold text-zinc-400 mb-3">平台分布</h3>
          {platforms.length === 0 ? (
            <p className="text-xs text-zinc-600">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {platforms.slice(0, 6).map((p: any) => {
                const pct = Math.round((p.count / totalPlat) * 100);
                return (
                  <div key={p.platform}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-zinc-400">{p.platform || 'unknown'}</span>
                      <span className="text-zinc-500">{p.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 最近生成 + Top品牌 ── */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            最近生成
          </h3>
          {recentLogs.length === 0 ? (
            <p className="text-xs text-zinc-600">暂无记录</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[11px] text-zinc-300 truncate">{log.brandName}</span>
                    </div>
                    <p className="text-[9px] text-zinc-600 mt-0.5">{log.platform} · {log.imageModel || '—'} · {log.latencyMs < 1000 ? `${log.latencyMs}ms` : `${(log.latencyMs/1000).toFixed(1)}s`}</p>
                  </div>
                  <span className="text-[9px] text-zinc-600 shrink-0 ml-2">{new Date(log.createdAt).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              ))}
            </div>
          )}

          {topBrands.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-zinc-400 mb-3 mt-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                热门品牌
              </h3>
              <div className="space-y-1.5">
                {topBrands.map((b: any, i: number) => (
                  <div key={b.brand} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] text-zinc-500 font-bold">{i+1}</span>
                      <span className="text-[11px] text-zinc-300">{b.brand}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{b.count}次</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 底部汇总条 ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-xs text-zinc-500">
        <span>配额使用率 {(stats?.quotaUsageRate ?? 0).toFixed(1)}%</span>
        <span>平均生成/用户 {(stats?.avgPerUser ?? 0).toFixed(1)}</span>
        <span>数据更新于 {new Date().toLocaleTimeString('zh-CN')}</span>
      </div>
    </div>
  );
}

// ─── Users ──────────────────────────────────────────────────────
interface UserDetail {
  brands: any[]; memories: any[]; recentAssets: any[];
  quota: { total: number; used: number; remaining: number; usageRate: number };
  stats: { totalAssets: number; totalBrands: number; totalMemories: number };
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuota, setEditQuota] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<UserDetail | null>(null);
  const [expandLoading, setExpandLoading] = useState(false);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  // Extra detail state
  const [userGenerations, setUserGenerations] = useState<any[]>([]);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);
  const [userExtraLoading, setUserExtraLoading] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit), search });
    const res = await fetch(`/api/admin/users?${q}`).then(r => r.json());
    setUsers(res.users ?? []);
    setTotal(res.total ?? 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const updateQuota = async (id: string) => {
    const val = parseInt(editQuota);
    if (isNaN(val)) return;
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotaTotal: val }),
    });
    setEditingId(null);
    load();
  };

  const toggleDisabled = async (u: AdminUser) => {
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !u.disabled }),
    });
    load();
  };

  const toggleExpand = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setExpandedDetail(null);
      setUserGenerations([]);
      setUserTemplates([]);
      return;
    }
    setExpandedId(userId);
    setExpandLoading(true);
    setUserExtraLoading(true);
    try {
      const [detailRes, genRes, tmplRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}/detail`).then(r => r.json()),
        fetch(`/api/admin/generations?userId=${userId}&limit=10`).then(r => r.json()).catch(() => ({ logs: [] })),
        fetch(`/api/admin/prompt-templates?userId=${userId}`).then(r => r.json()).catch(() => ({ templates: [] })),
      ]);
      setExpandedDetail({
        brands: detailRes.brands ?? [],
        memories: detailRes.memories ?? [],
        recentAssets: detailRes.recentAssets ?? [],
        quota: detailRes.quota ?? { total: 0, used: 0, remaining: 0, usageRate: 0 },
        stats: detailRes.stats ?? { totalAssets: 0, totalBrands: 0, totalMemories: 0 },
      });
      setUserGenerations(genRes.logs || []);
      setUserTemplates(tmplRes.templates || []);
    } catch { setExpandedDetail(null); }
    setExpandLoading(false);
    setUserExtraLoading(false);
  };

  const extendUser = async (id: string) => {
    const days = parseInt(extendDays);
    if (isNaN(days) || days <= 0) return;
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extendDays: days }),
    });
    setExtendingId(null);
    setExtendDays('30');
    load();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">客户管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索邮箱/姓名/公司" className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none focus:border-violet-500 w-56" />
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="text-xs text-zinc-500">共 {total} 个客户</div>
          <div className="space-y-1">
            {users.map(u => (
              <div key={u.id}>
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/50">
                  <button onClick={() => toggleExpand(u.id)} className="text-zinc-500 hover:text-white shrink-0">
                    {expandedId === u.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleExpand(u.id)} className="text-zinc-500 hover:text-violet-400 shrink-0" title="查看详情">
                    <Eye className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0 grid grid-cols-7 gap-2 items-center">
                    <div className="col-span-2 min-w-0">
                      <p className="text-sm text-white truncate">{u.email}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{u.name || '—'}</p>
                    </div>
                    <div className="text-right">
                      {editingId === u.id ? (
                        <input type="number" value={editQuota} onChange={e => setEditQuota(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && updateQuota(u.id)}
                          className="w-14 px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-white text-xs text-right outline-none" autoFocus />
                      ) : (
                        <span className="text-xs text-white">{u.quotaTotal}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-400">{u.quotaUsed}</span>
                      <span className="text-[10px] text-zinc-600 ml-1">({u.quotaTotal > 0 ? Math.round(u.quotaUsed / u.quotaTotal * 100) : 0}%)</span>
                    </div>
                    <p className="text-xs text-zinc-400 text-right">{u._count.assets}</p>
                    <div className="text-right">
                      {u.expiresAt ? (() => {
                        const exp = new Date(u.expiresAt);
                        const now = new Date();
                        const diffMs = exp.getTime() - now.getTime();
                        const diffDays = diffMs / (1000 * 60 * 60 * 24);
                        const fmt = `${String(exp.getMonth() + 1).padStart(2, '0')}-${String(exp.getDate()).padStart(2, '0')} ${String(exp.getHours()).padStart(2, '0')}:${String(exp.getMinutes()).padStart(2, '0')}`;
                        if (diffMs < 0) return <span className="text-[10px] text-red-400">已过期 <span className="text-zinc-600">{fmt}</span></span>;
                        if (diffDays <= 7) return <span className="text-[10px] text-yellow-400">即将过期 <span className="text-zinc-600">{fmt}</span></span>;
                        return <span className="text-[10px] text-zinc-400">{fmt}</span>;
                      })() : <span className="text-[10px] text-zinc-600">永久</span>}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.disabled ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                        {u.disabled ? '禁用' : '正常'}
                      </span>
                      {editingId === u.id ? (
                        <>
                          <button onClick={() => updateQuota(u.id)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <button onClick={() => { setEditingId(u.id); setEditQuota(String(u.quotaTotal)); }}
                          className="text-[10px] text-violet-400 hover:text-violet-300">调配额</button>
                      )}
                      <button onClick={() => { setExtendingId(extendingId === u.id ? null : u.id); setExtendDays('30'); }}
                        className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />续期
                      </button>
                      <button onClick={() => toggleDisabled(u)}
                        className={`text-[10px] ${u.disabled ? 'text-emerald-400' : 'text-red-400'} hover:opacity-80`}>
                        {u.disabled ? '启用' : '禁用'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extend inline */}
                {extendingId === u.id && (
                  <div className="bg-zinc-900/50 border-b border-zinc-800/50 px-6 py-3 flex items-center gap-3">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="text-xs text-zinc-400">续期天数:</span>
                    <div className="flex gap-1.5">
                      {[7, 30, 90, 365].map(d => (
                        <button key={d} onClick={() => setExtendDays(String(d))}
                          className={`text-[10px] px-2 py-1 rounded border transition ${extendDays === String(d) ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                          {d}天
                        </button>
                      ))}
                      <input type="number" placeholder="自定义"
                        value={[7, 30, 90, 365].includes(Number(extendDays)) ? '' : extendDays}
                        onChange={e => { if (e.target.value) setExtendDays(e.target.value); }}
                        className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-white outline-none focus:border-violet-500" />
                    </div>
                    <button onClick={() => extendUser(u.id)}
                      className="text-[10px] px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded transition ml-auto">
                      确认续期
                    </button>
                    <button onClick={() => setExtendingId(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300">
                      取消
                    </button>
                  </div>
                )}

                {/* Expanded detail */}
                {expandedId === u.id && (
                  <div className="bg-zinc-900/50 border-b border-zinc-800/50 px-6 py-4 max-h-[600px] overflow-y-auto">
                    {/* Registration info (always shown) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 pb-4 border-b border-zinc-800/50">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">邮箱</p>
                        <p className="text-xs text-white truncate">{u.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">姓名</p>
                        <p className="text-xs text-white">{u.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">公司</p>
                        <p className="text-xs text-white">{u.company || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">电话</p>
                        <p className="text-xs text-white">{u.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">注册时间</p>
                        <p className="text-xs text-white">{u.createdAt ? new Date(u.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">状态</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.disabled ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                          {u.disabled ? '禁用' : '正常'}
                        </span>
                      </div>
                    </div>
                    {expandLoading ? <Loading /> : expandedDetail ? (
                      <div className="space-y-4">
                        {/* Quota bar */}
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-zinc-500 w-8">配额</span>
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, expandedDetail.quota.usageRate)}%` }} />
                          </div>
                          <span className="text-[10px] text-zinc-400">{expandedDetail.quota.used}/{expandedDetail.quota.total} ({expandedDetail.quota.usageRate}%)</span>
                        </div>

                        {/* Brands */}
                        {expandedDetail.brands.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">品牌档案 ({expandedDetail.stats.totalBrands})</p>
                            {expandedDetail.brands.map((b: any) => (
                              <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/40 rounded text-xs">
                                <span className="text-white font-medium">{b.brandName}</span>
                                {b.industry && <span className="text-[10px] text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded">{b.industry}</span>}
                                {b.style && <span className="text-[10px] text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded">{b.style}</span>}
                                {b.targetAudience && <span className="text-[10px] text-zinc-400">→ {b.targetAudience}</span>}
                                <span className="text-[10px] text-zinc-600 ml-auto">生成 {b.usageCount} 次</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Memories */}
                        {expandedDetail.memories.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">偏好记忆 ({expandedDetail.stats.totalMemories})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {expandedDetail.memories.map((m: any) => (
                                <span key={m.id} className="text-[10px] bg-zinc-800/60 text-zinc-300 px-2 py-1 rounded">
                                  <span className="text-zinc-500">{m.key}:</span> {m.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent assets */}
                        {expandedDetail.recentAssets.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">最近素材 ({expandedDetail.stats.totalAssets})</p>
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                              {expandedDetail.recentAssets.slice(0, 8).map((a: any) => (
                                <div key={a.id} className="aspect-square bg-zinc-800 rounded overflow-hidden">
                                  <img src={a.imageUrl} alt={a.brandName} className="w-full h-full object-cover" loading="lazy" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Generation history */}
                        {!userExtraLoading && userGenerations.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">最近生成记录</p>
                            <div className="space-y-1">
                              {userGenerations.slice(0, 10).map((g: any) => (
                                <div key={g.id} className="flex items-center gap-3 px-3 py-2 bg-zinc-800/30 rounded-lg">
                                  <div className="w-8 h-8 rounded bg-zinc-800 overflow-hidden shrink-0">
                                    {g.imageUrl ? (
                                      <img src={g.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-3 h-3 text-zinc-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-white font-medium truncate">{g.brandName || '—'}</span>
                                      <span className="text-[10px] text-zinc-500">{g.sceneLabel || ''}</span>
                                      {g.success ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                      ) : (
                                        <X className="w-3 h-3 text-red-500" />
                                      )}
                                    </div>
                                    <p className="text-[9px] text-zinc-600">
                                      {g.platform || ''}{g.platform && g.aspectRatio ? ' · ' : ''}{g.aspectRatio || ''}
                                      {g.latencyMs ? ` · ${g.latencyMs < 1000 ? `${g.latencyMs}ms` : `${(g.latencyMs/1000).toFixed(1)}s`}` : ''}
                                    </p>
                                  </div>
                                  <span className="text-[9px] text-zinc-600 shrink-0">
                                    {new Date(g.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Prompt templates */}
                        {!userExtraLoading && userTemplates.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">自定义Prompt模板 ({userTemplates.length})</p>
                            <div className="space-y-1">
                              {userTemplates.map((t: any) => (
                                <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/30 rounded-lg">
                                  <Save className="w-3 h-3 text-violet-400 shrink-0" />
                                  <span className={`text-xs ${t.isActive ? 'text-white' : 'text-zinc-500 line-through'} font-medium truncate flex-1`}>
                                    {t.label || '未命名'}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.scope === 'user_brand' ? 'bg-violet-900/50 text-violet-400' : t.scope === 'user' ? 'bg-blue-900/50 text-blue-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                                    {t.scope}
                                  </span>
                                  {t.brandName && (
                                    <span className="text-[10px] text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded">{t.brandName}</span>
                                  )}
                                  <span className="text-[9px] text-zinc-600 shrink-0">
                                    {new Date(t.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!userExtraLoading && userGenerations.length === 0 && userTemplates.length === 0 && (
                          <p className="text-xs text-zinc-600">无生成记录和自定义模板</p>
                        )}
                      </div>
                    ) : <p className="text-xs text-zinc-500">加载失败</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Guests (未登录用户使用记录) ─────────────────────────────────
function GuestsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/guests?page=${page}&limit=30`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">游客使用记录</h2>

      {loading ? <Loading /> : summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">总生成次数</p>
              <p className="text-2xl font-bold text-white">{summary.totalGenerations}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">成功</p>
              <p className="text-2xl font-bold text-emerald-400">{summary.totalSuccess}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">失败</p>
              <p className="text-2xl font-bold text-red-400">{summary.totalFail}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">独立IP数</p>
              <p className="text-2xl font-bold text-violet-400">{summary.uniqueIps}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">24h内</p>
              <p className="text-2xl font-bold text-cyan-400">{summary.last24h}</p>
            </div>
          </div>

          {/* Log table */}
          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-12">暂无游客使用记录</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 mb-2">最近 {logs.length} 条记录</p>
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/50 hover:bg-zinc-900/50 rounded">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                    {log.imageUrl ? (
                      <img src={log.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <X className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-6 gap-2 items-center">
                    <div className="col-span-1 min-w-0">
                      <p className="text-xs text-white truncate">{log.brandName || '—'}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{log.sellingPoint || '—'}</p>
                    </div>
                    <p className="text-xs text-zinc-400">{log.platform || '—'}</p>
                    <p className="text-xs text-zinc-400">{log.aspectRatio || '—'}</p>
                    <p className="text-xs text-zinc-500 truncate">{log.ip || '—'}</p>
                    <p className="text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${log.success ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                        {log.success ? '成功' : '失败'}
                      </span>
                      {log.provider && <span className="text-[10px] text-zinc-600 truncate">{log.provider}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Generations (完整生成日志) ─────────────────────────────────
function GenerationsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 20;

  // Prompt template state
  const [savePanelId, setSavePanelId] = useState<string | null>(null);
  const [tmplLabel, setTmplLabel] = useState('');
  const [tmplScope, setTmplScope] = useState<'user_brand' | 'user' | 'brand'>('user_brand');
  const [tmplSaving, setTmplSaving] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<Record<string, any[]>>({});
  const [tmplLoading, setTmplLoading] = useState(false);
  const [editTmplId, setEditTmplId] = useState<string | null>(null);
  const [editTmplPrompt, setEditTmplPrompt] = useState('');
  const [editTmplLabel, setEditTmplLabel] = useState('');
  const [editTmplSaving, setEditTmplSaving] = useState(false);

  // Fetch existing templates when expanding a log
  useEffect(() => {
    if (!expandedId) return;
    const log = logs.find(l => l.id === expandedId);
    if (!log) return;
    const key = `${log.userId || 'guest'}_${log.brandName || ''}`;
    if (existingTemplates[key]) return; // already loaded
    setTmplLoading(true);
    const params = new URLSearchParams();
    if (log.userId) params.set('userId', log.userId);
    if (log.brandName) params.set('brandName', log.brandName);
    fetch(`/api/admin/prompt-templates?${params}`)
      .then(r => r.json())
      .then(data => {
        setExistingTemplates(prev => ({ ...prev, [key]: data.templates || [] }));
      })
      .catch(() => {})
      .finally(() => setTmplLoading(false));
  }, [expandedId]);

  const saveAsTemplate = async (log: any) => {
    if (!log.prompt || !tmplLabel.trim()) return;
    setTmplSaving(true);
    try {
      await fetch('/api/admin/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: log.userId || undefined,
          brandName: log.brandName || undefined,
          scope: tmplScope,
          label: tmplLabel.trim(),
          prompt: log.prompt,
        }),
      });
      // Refresh templates
      const key = `${log.userId || 'guest'}_${log.brandName || ''}`;
      const params = new URLSearchParams();
      if (log.userId) params.set('userId', log.userId);
      if (log.brandName) params.set('brandName', log.brandName);
      const data = await fetch(`/api/admin/prompt-templates?${params}`).then(r => r.json());
      setExistingTemplates(prev => ({ ...prev, [key]: data.templates || [] }));
      setSavePanelId(null);
      setTmplLabel('');
      setTmplScope('user_brand');
    } catch {}
    setTmplSaving(false);
  };

  const disableTemplate = async (tmplId: string) => {
    await fetch(`/api/admin/prompt-templates/${tmplId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    // Refresh for the currently expanded log
    if (expandedId) {
      const log = logs.find(l => l.id === expandedId);
      if (log) {
        const key = `${log.userId || 'guest'}_${log.brandName || ''}`;
        const params = new URLSearchParams();
        if (log.userId) params.set('userId', log.userId);
        if (log.brandName) params.set('brandName', log.brandName);
        const data = await fetch(`/api/admin/prompt-templates?${params}`).then(r => r.json());
        setExistingTemplates(prev => ({ ...prev, [key]: data.templates || [] }));
      }
    }
  };

  const saveEditTemplate = async (tmplId: string) => {
    if (!editTmplPrompt.trim()) return;
    setEditTmplSaving(true);
    try {
      await fetch(`/api/admin/prompt-templates/${tmplId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: editTmplPrompt, label: editTmplLabel.trim() || undefined }),
      });
      // Refresh
      if (expandedId) {
        const log = logs.find(l => l.id === expandedId);
        if (log) {
          const key = `${log.userId || 'guest'}_${log.brandName || ''}`;
          const params = new URLSearchParams();
          if (log.userId) params.set('userId', log.userId);
          if (log.brandName) params.set('brandName', log.brandName);
          const data = await fetch(`/api/admin/prompt-templates?${params}`).then(r => r.json());
          setExistingTemplates(prev => ({ ...prev, [key]: data.templates || [] }));
        }
      }
      setEditTmplId(null);
    } catch {}
    setEditTmplSaving(false);
  };

  useEffect(() => { fetchLogs(); }, [page, filterBrand]);

  async function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filterBrand) params.set('brandName', filterBrand);
    try {
      const r = await fetch(`/api/admin/generations?${params}`);
      const d = await r.json();
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    } catch {}
    setLoading(false);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text" placeholder="品牌名筛选..." value={filterBrand}
          onChange={e => { setFilterBrand(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button onClick={fetchLogs} className="p-1.5 hover:bg-zinc-700 rounded-lg">
          <RefreshCw className="w-4 h-4" />
        </button>
        <span className="text-xs text-zinc-500 ml-auto">共 {total} 条记录</span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-zinc-500">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">暂无记录</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full text-left p-3 flex items-center gap-3 hover:bg-zinc-700/30"
              >
                {log.imageUrl && (
                  <img src={log.imageUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-white">{log.brandName}</span>
                    <span className="text-zinc-500">{log.sceneLabel || '-'}</span>
                    <span className="text-zinc-600">{log.aspectRatio || '-'}</span>
                    <span className="text-zinc-600">{log.platform || '-'}</span>
                    {log.success ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {log.userId ? `👤 ${log.userId.slice(0, 8)}...` : '🌐 游客'}
                    {log.ip && ` · ${log.ip}`}
                    {' · '}{new Date(log.createdAt).toLocaleString('zh-CN')}
                    {log.latencyMs && ` · ${Math.round(log.latencyMs/1000)}s`}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} />
              </button>

              {expandedId === log.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-zinc-700/50 pt-2">
                  {log.prompt && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Prompt</div>
                      <div className="text-xs text-zinc-300 bg-zinc-900 rounded p-2 whitespace-pre-wrap max-h-40 overflow-y-auto">{log.prompt}</div>
                      {/* Save as template button */}
                      {log.userId && (
                        <div className="mt-2">
                          {savePanelId === log.id ? (
                            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Save className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                <span className="text-xs text-white font-medium">保存为Prompt模板</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-zinc-500 shrink-0">标签:</label>
                                <input
                                  type="text" value={tmplLabel} onChange={e => setTmplLabel(e.target.value)}
                                  placeholder="如: 优化版-v2"
                                  className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white outline-none focus:border-violet-500"
                                  autoFocus
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-zinc-500 shrink-0">作用范围:</label>
                                <div className="flex gap-1.5">
                                  {(['user_brand', 'user', 'brand'] as const).map(s => (
                                    <button key={s} onClick={() => setTmplScope(s)}
                                      className={`text-[10px] px-2 py-0.5 rounded border transition ${tmplScope === s ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                                      {s === 'user_brand' ? '用户+品牌' : s === 'user' ? '仅用户' : '仅品牌'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => { setSavePanelId(null); setTmplLabel(''); setTmplScope('user_brand'); }}
                                  className="text-[10px] text-zinc-500 hover:text-zinc-300">取消</button>
                                <button onClick={() => saveAsTemplate(log)} disabled={tmplSaving || !tmplLabel.trim()}
                                  className="text-[10px] px-3 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition flex items-center gap-1">
                                  <Save className="w-3 h-3" />{tmplSaving ? '保存中...' : '确认保存'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setSavePanelId(log.id); setTmplLabel(''); setTmplScope('user_brand'); }}
                              className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition">
                              <Save className="w-3 h-3" />保存为模板
                            </button>
                          )}
                        </div>
                      )}

                      {/* Existing templates warning */}
                      {tmplLoading && <div className="mt-2 text-[10px] text-zinc-500">加载模板中...</div>}
                      {!tmplLoading && (() => {
                        const key = `${log.userId || 'guest'}_${log.brandName || ''}`;
                        const tmpls = existingTemplates[key]?.filter((t: any) => t.isActive) || [];
                        if (tmpls.length === 0) return null;
                        return (
                          <div className="mt-2 space-y-1.5">
                            {tmpls.map((t: any) => (
                              <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-amber-900/20 border border-amber-800/40 rounded-lg">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-[10px] text-amber-300 flex-1">
                                  当前有自定义模板: <span className="text-white font-medium">{t.label || '未命名'}</span>
                                  <span className="text-amber-500/60 ml-1">({t.scope})</span>
                                </span>
                                <button onClick={() => {
                                  setEditTmplId(t.id);
                                  setEditTmplPrompt(t.prompt);
                                  setEditTmplLabel(t.label || '');
                                }}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 transition">查看/编辑</button>
                                <button onClick={() => disableTemplate(t.id)}
                                  className="text-[10px] text-red-400 hover:text-red-300 transition">停用</button>
                              </div>
                            ))}
                            {/* Edit panel */}
                            {editTmplId && (() => {
                              const editingTmpl = tmpls.find((t: any) => t.id === editTmplId);
                              if (!editingTmpl) return null;
                              return (
                                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-white font-medium">编辑模板</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-zinc-500 shrink-0">标签:</label>
                                    <input type="text" value={editTmplLabel} onChange={e => setEditTmplLabel(e.target.value)}
                                      placeholder="模板标签"
                                      className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white outline-none focus:border-violet-500" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-zinc-500">Prompt:</label>
                                    <textarea value={editTmplPrompt} onChange={e => setEditTmplPrompt(e.target.value)}
                                      rows={4}
                                      className="w-full mt-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300 outline-none focus:border-violet-500 whitespace-pre-wrap" />
                                  </div>
                                  <div className="flex items-center gap-2 justify-end">
                                    <button onClick={() => setEditTmplId(null)}
                                      className="text-[10px] text-zinc-500 hover:text-zinc-300">取消</button>
                                    <button onClick={() => saveEditTemplate(editTmplId)} disabled={editTmplSaving}
                                      className="text-[10px] px-3 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded transition flex items-center gap-1">
                                      <Save className="w-3 h-3" />{editTmplSaving ? '保存中...' : '保存修改'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {log.sceneDesc && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">场景描述</div>
                      <div className="text-xs text-zinc-300">{log.sceneDesc}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {log.style && <div><span className="text-zinc-500">风格:</span> {log.style}</div>}
                    {log.mood && <div><span className="text-zinc-500">氛围:</span> {log.mood}</div>}
                    {log.targetCountry && <div><span className="text-zinc-500">国家:</span> {log.targetCountry}</div>}
                    {log.imageModel && <div><span className="text-zinc-500">模型:</span> {log.imageModel}</div>}
                  </div>
                  {log.workflow && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">工作流</div>
                      <pre className="text-xs text-zinc-400 bg-zinc-900 rounded p-2">{JSON.stringify(log.workflow, null, 2)}</pre>
                    </div>
                  )}
                  {log.error && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">错误</div>
                      <div className="text-xs text-red-400">{log.error}</div>
                    </div>
                  )}
                  {log.imageUrl && (
                    <div>
                      <img src={log.imageUrl} alt="" className="max-h-60 rounded" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="p-1.5 bg-zinc-800 rounded disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="p-1.5 bg-zinc-800 rounded disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Assets ─────────────────────────────────────────────────────
interface ClientRow {
  id: string; email: string; name: string | null; company: string | null;
  assetCount: number; brandCount: number; lastActive: string | null;
}

function AssetsTab() {
  const [view, setView] = useState<'grid' | 'clients'>('clients');
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clientAssets, setClientAssets] = useState<AdminAsset[]>([]);
  const [clientBrands, setClientBrands] = useState<Record<string, unknown>[]>([]);
  const [clientMemories, setClientMemories] = useState<Record<string, unknown>[]>([]);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const limit = 20;

  const loadGrid = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit), search });
    const res = await fetch(`/api/admin/assets?${q}`).then(r => r.json());
    setAssets(res.assets ?? []);
    setTotal(res.total ?? 0);
    setLoading(false);
  }, [page, search]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ groupByUser: 'true', search });
    const res = await fetch(`/api/admin/assets?${q}`).then(r => r.json());
    setClients(res.clients ?? []);
    setTotal(res.total ?? 0);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (view === 'grid') loadGrid();
    else loadClients();
  }, [view, loadGrid, loadClients]);

  const loadClientDetail = async (client: ClientRow) => {
    setSelectedClient(client);
    setClientDetailLoading(true);
    try {
      const [assetsRes, detailRes] = await Promise.all([
        fetch(`/api/admin/assets?userId=${client.id}&limit=50`).then(r => r.json()),
        fetch(`/api/admin/users/${client.id}/detail`).then(r => r.json()),
      ]);
      setClientAssets(assetsRes.assets ?? []);
      setClientBrands(detailRes.brands ?? []);
      setClientMemories(detailRes.memories ?? []);
    } catch { /* ignore */ }
    setClientDetailLoading(false);
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('确认删除此素材？')) return;
    await fetch(`/api/admin/assets?id=${id}`, { method: 'DELETE' });
    if (selectedClient) loadClientDetail(selectedClient);
    else if (view === 'grid') loadGrid();
    else loadClients();
  };

  // Client detail panel
  if (selectedClient) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelectedClient(null); setClientAssets([]); setClientBrands([]); setClientMemories([]); }}
          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" />返回客户列表
        </button>

        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{selectedClient.name || selectedClient.email}</h2>
            <p className="text-xs text-zinc-500">{selectedClient.email} {selectedClient.company && `· ${selectedClient.company}`}</p>
          </div>
          <div className="flex gap-3 ml-auto text-xs">
            <span className="text-zinc-400">{selectedClient.assetCount} 张素材</span>
            <span className="text-zinc-400">{selectedClient.brandCount} 个品牌</span>
          </div>
        </div>

        {clientDetailLoading ? <Loading /> : (
          <>
            {/* Brands */}
            {clientBrands.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <p className="text-sm font-medium text-white">品牌档案</p>
                <div className="space-y-2">
                  {clientBrands.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-3 px-3 py-2 bg-zinc-800/50 rounded-lg">
                      <span className="text-sm text-white">{b.brandName}</span>
                      {b.industry && <span className="text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded">{b.industry}</span>}
                      {b.style && <span className="text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded">{b.style}</span>}
                      {b.targetAudience && <span className="text-[10px] text-zinc-400">→ {b.targetAudience}</span>}
                      <span className="text-[10px] text-zinc-600 ml-auto">生成 {b.usageCount} 次</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memories / Preferences */}
            {clientMemories.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <p className="text-sm font-medium text-white">偏好记忆</p>
                <div className="space-y-1">
                  {clientMemories.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{m.category}</span>
                      <span className="text-zinc-400">{m.key}:</span>
                      <span className="text-white">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assets */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">全部素材 ({clientAssets.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {clientAssets.map(a => (
                  <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                    <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                      <img src={a.imageUrl} alt={a.brandName} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setPreviewUrl(a.imageUrl)} className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Eye className="w-3 h-3" />预览</button>
                        <button onClick={() => deleteAsset(a.id)} className="bg-red-600/80 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Trash2 className="w-3 h-3" />删除</button>
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-medium text-white truncate">{a.brandName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>{a.platform}</span><span>·</span><span>{a.aspectRatio}</span><span>·</span><span>{a.sceneLabel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPreviewUrl(null)}>
            <div className="absolute inset-0 bg-black/80" />
            <img src={previewUrl} className="relative z-10 max-w-[90vw] max-h-[85vh] object-contain rounded-xl" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">素材库</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索品牌/邮箱" className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none focus:border-violet-500 w-48" />
          </div>
          <div className="flex border border-zinc-800 rounded-lg overflow-hidden">
            <button onClick={() => setView('clients')}
              className={`px-3 py-2 text-xs transition ${view === 'clients' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              按客户
            </button>
            <button onClick={() => setView('grid')}
              className={`px-3 py-2 text-xs transition ${view === 'grid' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              全部
            </button>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        view === 'clients' ? (
          <>
            <div className="text-xs text-zinc-500">{total} 个客户有素材</div>
            <div className="space-y-2">
              {clients.map(c => (
                <button key={c.id} onClick={() => loadClientDetail(c)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-zinc-600 transition text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{c.name || c.email}</span>
                      {c.company && <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{c.company}</span>}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    <span className="text-violet-400">{c.assetCount} 张</span>
                    <span className="text-zinc-500">{c.brandCount} 品牌</span>
                    {c.lastActive && <span className="text-zinc-600">{new Date(c.lastActive).toLocaleDateString('zh')}</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-xs text-zinc-500">共 {total} 张素材</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map(a => (
                <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                  <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                    <img src={a.imageUrl} alt={a.brandName} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => setPreviewUrl(a.imageUrl)} className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Eye className="w-3 h-3" />预览</button>
                      <button onClick={() => deleteAsset(a.id)} className="bg-red-600/80 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Trash2 className="w-3 h-3" />删除</button>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-medium text-white truncate">{a.brandName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>{a.platform}</span><span>·</span><span>{a.aspectRatio}</span><span>·</span><span>{a.sceneLabel}</span>
                    </div>
                    <p className="text-[10px] text-zinc-600">{a.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={Math.ceil(total / limit)} setPage={setPage} />
          </>
        )
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPreviewUrl(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <img src={previewUrl} className="relative z-10 max-w-[90vw] max-h-[85vh] object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}

// ─── Invites ────────────────────────────────────────────────────
function InvitesTab() {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [genCount, setGenCount] = useState(5);
  const [genQuota, setGenQuota] = useState(50);
  const [genNote, setGenNote] = useState('');
  const [genValidDays, setGenValidDays] = useState('');
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');
  const limit = 20;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`/api/admin/invites?${q}`).then(r => r.json());
    setInvites(res.invites ?? []);
    setTotal(res.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    const body: Record<string, unknown> = { count: genCount, quota: genQuota, notePrefix: genNote };
    const vd = parseInt(genValidDays);
    if (!isNaN(vd) && vd > 0) body.validDays = vd;
    const res = await fetch('/api/admin/invites', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      showToast(`已生成 ${data.codes?.length ?? genCount} 个邀请码`);
      setPage(1);
      load();
    } else {
      showToast(data.error || '生成失败');
    }
  };

  const deleteInvite = async (id: string) => {
    if (!confirm('确认删除？')) return;
    const res = await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('已删除'); load(); }
    else { const d = await res.json(); showToast(d.error || '删除失败'); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('已复制: ' + code);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">邀请码管理</h2>

      {/* Generate */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-sm font-medium text-white mb-3">批量生成</p>
        <div className="flex items-end gap-3">
          <div>
            <label className="text-xs text-zinc-500">数量</label>
            <input type="number" value={genCount} onChange={e => setGenCount(Number(e.target.value))}
              className="block w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">配额</label>
            <input type="number" value={genQuota} onChange={e => setGenQuota(Number(e.target.value))}
              className="block w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">备注前缀</label>
            <input value={genNote} onChange={e => setGenNote(e.target.value)}
              className="block w-40 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">有效天数</label>
            <input type="number" value={genValidDays} onChange={e => setGenValidDays(e.target.value)} placeholder="留空=永久"
              className="block w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none placeholder:text-zinc-600" />
          </div>
          <button onClick={generate} disabled={generating}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm rounded-lg transition flex items-center gap-2">
            {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            生成
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="text-sm text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />{toast}</div>}

      {loading ? <Loading /> : (
        <>
          <div className="text-xs text-zinc-500">共 {total} 个邀请码</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                <th className="text-left py-3 font-medium">邀请码</th>
                <th className="text-right py-3 font-medium">配额</th>
                <th className="text-left py-3 font-medium">备注</th>
                <th className="text-right py-3 font-medium">有效期</th>
                <th className="text-left py-3 font-medium">状态</th>
                <th className="text-left py-3 font-medium">使用者</th>
                <th className="text-right py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                  <td className="py-3 text-white font-mono text-xs">{inv.code}</td>
                  <td className="py-3 text-right text-zinc-400">{inv.quota}</td>
                  <td className="py-3 text-zinc-400">{inv.note || '—'}</td>
                  <td className="py-3 text-right text-zinc-400 text-xs">{inv.validDays ? `${inv.validDays}天` : '永久'}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${inv.usedAt ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                      {inv.usedAt ? '已用' : '未用'}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-500 text-xs">{inv.usedBy?.email || '—'}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => copyCode(inv.code)} className="text-violet-400 hover:text-violet-300"><Copy className="w-3.5 h-3.5" /></button>
                      {!inv.usedAt && (
                        <button onClick={() => deleteInvite(inv.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={Math.ceil(total / limit)} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Workflows & Prompts ────────────────────────────────────────
interface PromptData {
  label: string; desc: string; default: string; current: string;
  model: string; variables: string[]; customized: boolean;
}
interface WorkflowNode {
  id: string; label: string; desc: string; type: string; model: string; next: string[]; promptKey?: string;
}

function WorkflowsTab() {
  const [prompts, setPrompts] = useState<Record<string, PromptData> | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowNode[]>([]);
  const [runtime, setRuntime] = useState<Record<string, { value: unknown; default: unknown; label: string; desc: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [rtSaving, setRtSaving] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prompts').then(r => r.json());
      setPrompts(res.prompts);
      setWorkflow(res.workflow || []);
      setRuntime(res.runtime || null);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (key: string) => {
    if (!prompts) return;
    setEditingKey(key);
    setEditValue(prompts[key].current);
  };

  const saveOne = async (key: string) => {
    if (!prompts) return;
    setSaving(true);
    const updated = { ...prompts[key], current: editValue, customized: editValue !== prompts[key].default };
    const newPrompts = { ...prompts, [key]: updated };
    const agentPrompts: Record<string, string> = {};
    for (const [k, v] of Object.entries(newPrompts)) {
      agentPrompts[k] = v.current;
    }
    const res = await fetch('/api/admin/prompts', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentPrompts }),
    });
    setSaving(false);
    if (res.ok) {
      showToast(`"${updated.label}" 已保存`);
      setEditingKey(null);
      load();
    } else {
      showToast('保存失败');
    }
  };

  const saveRuntime = async () => {
    if (!runtime) return;
    setRtSaving(true);
    const agentRuntime: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(runtime)) {
      agentRuntime[k] = v.value;
    }
    const res = await fetch('/api/admin/prompts', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentRuntime }),
    });
    setRtSaving(false);
    if (res.ok) { showToast('运行时配置已保存'); load(); }
    else showToast('保存失败');
  };

  const resetAll = async () => {
    if (!confirm('确认重置所有Prompt和运行时配置为默认值？此操作不可撤销。')) return;
    const res = await fetch('/api/admin/prompts', { method: 'DELETE' });
    if (res.ok) { showToast('已重置为默认值'); load(); }
    else showToast('重置失败');
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">工作流 & 配置</h2>
          <p className="text-xs text-zinc-500 mt-1">控制Agent实际行为 — Prompt、模型、速率限制全部生效</p>
        </div>
        <button onClick={resetAll}
          className="px-4 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg hover:border-zinc-600 transition flex items-center gap-2">
          <RotateCcw className="w-3 h-3" />全部重置
        </button>
      </div>

      {/* Toast */}
      {toast && <div className="text-sm text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />{toast}</div>}

      {/* ─── Runtime Config ─── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white">运行时配置</p>
          <button onClick={saveRuntime} disabled={rtSaving}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs rounded-lg transition flex items-center gap-2">
            <Save className="w-3 h-3" />{rtSaving ? '保存中...' : '保存配置'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {runtime && Object.entries(runtime).map(([key, field]) => {
            const isSelect = key === 'imageProvider';
            const isNumber = typeof field.value === 'number';
            return (
              <div key={key}>
                <label className="text-xs text-zinc-500 mb-1 block">{field.label}</label>
                {isSelect ? (
                  <select value={String(field.value)} onChange={e => setRuntime({ ...runtime!, [key]: { ...field, value: e.target.value } })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none">
                    <option value="auto">auto (Novart优先, TR备用)</option>
                    <option value="novart">novart (仅Novart)</option>
                    <option value="tokenrouter">tokenrouter (仅TR)</option>
                  </select>
                ) : (
                  <input
                    type={isNumber ? 'number' : 'text'}
                    step={key === 'llmTemperature' ? '0.1' : undefined}
                    min={isNumber ? 0 : undefined}
                    value={String(field.value)}
                    onChange={e => setRuntime({ ...runtime!, [key]: { ...field, value: isNumber ? Number(e.target.value) : e.target.value } })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none font-mono"
                  />
                )}
                <p className="text-[10px] text-zinc-600 mt-1">{field.desc} (默认: {String(field.default)})</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Workflow Visualization ─── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="text-sm font-medium text-white mb-4">Agent 工作流</p>
        <div className="flex flex-wrap gap-3">
          {workflow.map((node, i) => {
            const promptData = prompts && node.promptKey ? prompts[node.promptKey] : null;
            return (
              <div key={node.id} className="flex items-center gap-3">
                <div className={`px-4 py-3 rounded-lg border min-w-[140px] ${
                  node.type === 'prompt' ? 'bg-violet-950/40 border-violet-800/50' : 'bg-zinc-800/50 border-zinc-700/50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${node.type === 'prompt' ? 'bg-violet-400' : 'bg-zinc-500'}`} />
                    <span className="text-xs font-medium text-white">{node.label}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">{node.desc}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{node.model}</p>
                  {node.type === 'prompt' && promptData?.customized && (
                    <span className="inline-block text-[9px] text-violet-400 bg-violet-900/30 px-1.5 py-0.5 rounded mt-1">已自定义</span>
                  )}
                </div>
                {i < workflow.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Prompt Cards ─── */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-white">Prompt 模板</p>
        {prompts && Object.entries(prompts).map(([key, p]) => (
          <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">{p.label}</span>
                {p.customized && <span className="text-[9px] text-violet-400 bg-violet-900/30 px-1.5 py-0.5 rounded">已自定义</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600">{p.model}</span>
                <button onClick={() => editingKey === key ? setEditingKey(null) : startEdit(key)}
                  className="text-xs text-violet-400 hover:text-violet-300">
                  {editingKey === key ? '收起' : '编辑'}
                </button>
              </div>
            </div>

            {/* Description + Variables */}
            <div className="px-5 py-2 flex items-center gap-4">
              <p className="text-xs text-zinc-500">{p.desc}</p>
              <div className="flex gap-1.5 shrink-0">
                {p.variables.map(v => (
                  <span key={v} className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>
                ))}
              </div>
            </div>

            {/* Editor */}
            {editingKey === key && (
              <div className="px-5 pb-4 space-y-3">
                <textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows={12}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs outline-none resize-y font-mono leading-relaxed" />
                <div className="flex items-center gap-3">
                  <button onClick={() => saveOne(key)} disabled={saving}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs rounded-lg transition flex items-center gap-2">
                    <Save className="w-3 h-3" />{saving ? '保存中...' : '保存'}
                  </button>
                  <button onClick={() => { setEditValue(p.default); }}
                    className="px-4 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg hover:border-zinc-600 transition flex items-center gap-2">
                    <RotateCcw className="w-3 h-3" />恢复默认
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings (API keys remain here — runtime config moved to WorkflowsTab) ────
// ─── FeedbacksTab ──────────────────────────────────────────────────
function FeedbacksTab() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/feedbacks?page=${page}&limit=20`);
    const data = await res.json();
    setFeedbacks(data.feedbacks || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/feedbacks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ignored: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">用户反馈</h2>
          <p className="text-xs text-zinc-500 mt-1">共 {total} 条反馈</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-all">
          <RefreshCw className="w-3 h-3 inline mr-1" />刷新
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">加载中...</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm">暂无反馈</div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb: any) => (
            <div key={fb.id} className="rounded-xl p-4 border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap">{fb.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                    <span>{fb.page || '/'}</span>
                    <span>·</span>
                    <span>{fb.userId || fb.ip || '?'}</span>
                    <span>·</span>
                    <span>{new Date(fb.createdAt).toLocaleString('zh-CN')}</span>
                    {fb.contact && (<><span>·</span><span className="text-violet-400">{fb.contact}</span></>)}
                  </div>
                </div>
                <select
                  value={fb.status}
                  onChange={e => updateStatus(fb.id, e.target.value)}
                  className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-medium border ${statusColors[fb.status] || statusColors.pending}`}
                >
                  <option value="pending">待处理</option>
                  <option value="resolved">已解决</option>
                  <option value="ignored">已忽略</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AnalyticsTab: 访问统计 ──────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <p className="text-sm text-zinc-500">加载失败</p>;

  const summaryCards = [
    { label: '今日PV', value: data.todayPV, sub: `UV ${data.todayUV}`, gradient: 'from-blue-600 to-cyan-700', change: data.pvGrowth },
    { label: '总PV', value: data.totalPV, sub: `UV ${data.totalUV}`, gradient: 'from-violet-600 to-purple-700', change: data.weekOverWeek },
    { label: '跳出率', value: `${data.bounceRate}%`, sub: `注册 ${data.regPV} / 游客 ${data.guestPV}`, gradient: 'from-amber-500 to-orange-600' },
    { label: '本周vs上周', value: `${data.weekOverWeek > 0 ? '+' : ''}${data.weekOverWeek}%`, sub: '周环比', gradient: data.weekOverWeek >= 0 ? 'from-emerald-600 to-teal-700' : 'from-red-500 to-rose-600' },
  ];

  const totalDevice = (data.devices || []).reduce((s: number, d: any) => s + d.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">访问统计</h2>
        <span className="text-[10px] text-zinc-500">{new Date().toLocaleTimeString('zh-CN')} 更新</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-5 text-white shadow-lg`}>
            <p className="text-xs text-white/70 mb-1">{c.label}</p>
            <p className="text-3xl font-bold">{c.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-white/60">{c.sub}</p>
              {c.change !== undefined && c.change !== 0 && (
                <span className={`text-[10px] ${c.change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {c.change >= 0 ? '↑' : '↓'}{Math.abs(c.change)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PV/UV Trend 30d */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-4">近30天 PV / UV 趋势</h3>
          <div className="flex items-end gap-[3px] h-32">
            {(data.dailyPV || []).map((d: any, i: number) => {
              const uv = data.dailyUV?.[i];
              const max = Math.max(...(data.dailyPV || []).map((x: any) => x.count || 0), 1);
              const h = Math.max(2, ((d.count || 0) / max) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="w-full flex flex-col items-center gap-[1px]">
                    <div className="w-full bg-violet-500/60 rounded-t-sm" style={{ height: `${h}%` }} />
                    {uv && <div className="w-[60%] bg-cyan-400/70 rounded-t-sm" style={{ height: `${Math.max(2, ((uv.count || 0) / max) * 100)}%` }} />}
                  </div>
                  <span className="text-[8px] text-zinc-600">{d.date?.slice(5, 10)}</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300 whitespace-nowrap z-10">
                    PV: {d.count} {uv ? `UV: ${uv.count}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500/60" />PV</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400/70" />UV</span>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Device breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-400 mb-3">设备分布</h3>
            <div className="space-y-2">
              {(data.devices || []).map((d: any) => {
                const pct = Math.round((d.count / totalDevice) * 100);
                const colors: Record<string, string> = { desktop: 'bg-blue-500', mobile: 'bg-violet-500', tablet: 'bg-amber-500' };
                const labels: Record<string, string> = { desktop: '桌面端', mobile: '移动端', tablet: '平板' };
                return (
                  <div key={d.device}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-zinc-400">{labels[d.device] || d.device}</span>
                      <span className="text-zinc-500">{d.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800">
                      <div className={`h-full rounded-full ${colors[d.device] || 'bg-zinc-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page distribution */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-400 mb-3">页面分布（7天）</h3>
            <div className="space-y-1.5">
              {(data.pageDist || []).slice(0, 6).map((p: any) => (
                <div key={p.page} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-mono">{p.page}</span>
                  <span className="text-zinc-500">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Country */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3">地区分布（30天）</h3>
          {(data.countryDist || []).length === 0 ? <p className="text-xs text-zinc-600">暂无数据</p> : (
            <div className="space-y-2">
              {data.countryDist.slice(0, 8).map((c: any) => (
                <div key={c.country} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">{c.country}</span>
                  <span className="text-zinc-500">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top referrers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3">来源TOP 10（7天）</h3>
          {(data.topReferrers || []).length === 0 ? <p className="text-xs text-zinc-600">暂无数据</p> : (
            <div className="space-y-1.5">
              {data.topReferrers.map((r: any, i: number) => (
                <div key={r.referrer} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-zinc-600 shrink-0">{i + 1}</span>
                    <span className="text-zinc-400 truncate">{r.referrer}</span>
                  </div>
                  <span className="text-zinc-500 shrink-0 ml-2">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SettingsTab ──────────────────────────────────────────────────
function SettingsTab() {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(d => { setConfig(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const c = (config as Record<string, Record<string, unknown>>)?.adforge100x || {};
  const quotas = (config as any)?.quotas || {};
  const guest = quotas.guest || {};
  const registered = quotas.registered || {};

  const saveQuotas = async (newQuotas: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotas: newQuotas }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        showToast('权益配置已保存');
      } else {
        const d = await res.json();
        showToast(d.error || '保存失败');
      }
    } catch { showToast('保存失败'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">系统配置</h2>

      {/* ── 权益配置 ── */}
      <div className="space-y-4 max-w-2xl">
        <h3 className="text-sm font-semibold text-zinc-300">权益配置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 游客权益 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-400">👤 游客权益</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${guest.enabled !== false ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                {guest.enabled !== false ? '已开启' : '已关闭'}
              </span>
            </div>

            {/* 开关 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={guest.enabled !== false}
                onChange={e => saveQuotas({
                  ...quotas,
                  guest: { ...guest, enabled: e.target.checked },
                  registered,
                })}
                className="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-xs text-zinc-300">允许游客生成</span>
            </label>

            {/* 每日上限 */}
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">每日生成上限（0=不限，全站共享）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={guest.dailyLimit ?? 0}
                  onChange={e => saveQuotas({
                    ...quotas,
                    guest: { ...guest, dailyLimit: Number(e.target.value) || 0 },
                    registered,
                  })}
                  min={0}
                  className="w-24 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-zinc-600">次/天</span>
              </div>
            </div>

            {/* 总量上限 */}
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">总生成上限（0=不限，全站共享）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={guest.totalLimit ?? 0}
                  onChange={e => saveQuotas({
                    ...quotas,
                    guest: { ...guest, totalLimit: Number(e.target.value) || 0 },
                    registered,
                  })}
                  min={0}
                  className="w-24 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-zinc-600">次</span>
              </div>
            </div>
          </div>

          {/* 注册用户默认权益 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-400">🔐 注册用户默认权益</h4>
              <span className="text-[10px] text-zinc-600">注册时自动赋予</span>
            </div>

            {/* 默认额度 */}
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">默认生成额度</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={registered.defaultQuota ?? 10}
                  onChange={e => saveQuotas({
                    ...quotas,
                    guest,
                    registered: { ...registered, defaultQuota: Number(e.target.value) || 10 },
                  })}
                  min={1}
                  className="w-24 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-zinc-600">张</span>
              </div>
            </div>

            {/* 默认有效期 */}
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">默认有效天数（0=永久）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={registered.defaultValidDays ?? 0}
                  onChange={e => saveQuotas({
                    ...quotas,
                    guest,
                    registered: { ...registered, defaultValidDays: Number(e.target.value) || 0 },
                  })}
                  min={0}
                  className="w-24 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-zinc-600">天</span>
              </div>
            </div>

            {/* 说明 */}
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-600">有邀请码注册时，邀请码配置会覆盖默认值</p>
            </div>
          </div>
        </div>

        {toast && <div className="text-sm text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />{toast}</div>}
      </div>

      {/* ── 支付配置 (LemonSqueezy) ── */}
      <p className="text-xs text-zinc-500 mt-6">LemonSqueezy 支付配置。配置后用户可在 /pricing 页面订阅。</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">LemonSqueezy API Key</label>
          <p className={`text-sm font-mono ${process.env.NEXT_PUBLIC_NODE_ENV === 'production' ? 'text-zinc-500' : !!process.env.LEMONSQUEEZY_API_KEY ? 'text-emerald-400' : 'text-red-400'}`}>{!!process.env.LEMONSQUEEZY_API_KEY ? '✓ 已配置' : '✗ 未配置'}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Store ID</label>
          <p className={`text-sm font-mono ${!!process.env.LEMONSQUEEZY_STORE_ID ? 'text-emerald-400' : 'text-red-400'}`}>{!!process.env.LEMONSQUEEZY_STORE_ID ? '✓ 已配置' : '✗ 未配置'}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Webhook Secret</label>
          <p className={`text-sm font-mono ${!!process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? 'text-emerald-400' : 'text-red-400'}`}>{!!process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? '✓ 已配置' : '✗ 未配置'}</p>
        </div>
        <div className="pt-2 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600">通过 .env.local 设置 LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_STORE_ID / LEMONSQUEEZY_WEBHOOK_SECRET</p>
          <p className="text-[10px] text-zinc-600">Webhook端点: POST /api/webhooks/lemonsqueezy</p>
        </div>
      </div>

      {/* ── API配置（只读） ── */}
      <p className="text-xs text-zinc-500">API Key等敏感配置。运行时参数（模型/温度/限流）请到「工作流」Tab调整。</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Novart API Key</label>
          <p className={`text-sm font-mono ${(c as any).novartConfigured ? 'text-emerald-400' : 'text-red-400'}`}>{(c as any).novartConfigured ? '✓ 已配置' : '✗ 未配置'}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Novart Base URL</label>
          <p className="text-sm text-zinc-400 font-mono">{String(c.novartBaseUrl || '未配置')}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Novart 模型</label>
          <p className="text-sm text-zinc-400 font-mono">{String(c.novartModel || '未配置')}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">MiniMax 模型</label>
          <p className="text-sm text-zinc-400 font-mono">{String(c.minimaxModel || '未配置')}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">图片Provider</label>
          <p className="text-sm text-zinc-400 font-mono">{String(c.imageProvider || 'minimax')}</p>
        </div>
        <div className="pt-2 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600">以上Key通过 .env.local 或 Vercel 环境变量设置，此处仅展示状态。</p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared ─────────────────────────────────────────────────────
function Loading() {
  return <div className="flex items-center justify-center py-20 text-zinc-500"><RefreshCw className="w-5 h-5 animate-spin" /></div>;
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-2 text-zinc-500 hover:text-white disabled:opacity-30 transition"><ChevronLeft className="w-4 h-4" /></button>
      <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
      <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-2 text-zinc-500 hover:text-white disabled:opacity-30 transition"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Model Health Monitor ──────────────────────────────────────────
function ModelHealthTab() {
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/model-health', { method: 'POST' });
      const data = await res.json();
      setResults(data.results || []);
      setCheckedAt(data.checkedAt);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { runCheck(); }, [runCheck]);

  const typeColors: Record<string, string> = {
    LLM: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    Image: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    Database: 'from-green-500/20 to-green-600/10 border-green-500/20',
    Storage: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    Auth: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
    Vision: 'from-rose-500/20 to-rose-600/10 border-rose-500/20',
  };

  const typeLabels: Record<string, string> = {
    LLM: '🧠 大语言模型',
    Image: '🎨 图像生成',
    Database: '🗄️ 数据库',
    Storage: '📦 存储',
    Auth: '🔐 认证',
    Vision: '👁️ 视觉',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">模型监测</h2>
          <p className="text-xs text-zinc-500 mt-1">实时探测各服务可用性 · 每次点击重新检测</p>
        </div>
        <button onClick={runCheck} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
          style={{ background: loading ? 'rgba(139,92,246,0.1)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '检测中...' : '重新检测'}
        </button>
      </div>
      {checkedAt && <p className="text-[10px] text-zinc-600">上次检测：{new Date(checkedAt).toLocaleString('zh-CN')}</p>}

      {!results && loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          <span className="ml-3 text-zinc-400">正在探测各服务（30秒内）...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results?.map((r: any, i: number) => (
          <div key={i} className={`rounded-xl overflow-hidden border bg-gradient-to-br ${typeColors[r.type] || 'from-zinc-500/10 to-zinc-600/5 border-zinc-700/30'}`}>
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{r.name}</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{typeLabels[r.type] || r.type}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.ok ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                  {r.ok ? '● 正常' : '✕ 异常'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">响应延迟</span>
                  <span className={`text-xs font-mono font-bold ${r.latencyMs < 2000 ? 'text-emerald-400' : r.latencyMs < 8000 ? 'text-amber-400' : 'text-red-400'}`}>
                    {r.latencyMs < 1000 ? `${r.latencyMs}ms` : `${(r.latencyMs/1000).toFixed(1)}s`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${r.latencyMs < 2000 ? 'bg-emerald-500' : r.latencyMs < 8000 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (r.latencyMs / 15000) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">用途</span>
                  <span className="text-[10px] text-zinc-400">{r.usage || '—'}</span>
                </div>
                {r.detail && (
                  <div className="mt-1 px-2 py-1 rounded bg-black/20">
                    <span className="text-[9px] text-zinc-500 font-mono break-all">{String(r.detail).slice(0, 120)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {results && results.length > 0 && (
        <div className="px-5 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="flex items-center gap-6 text-xs">
            <span className="text-zinc-500">总计：{results.length} 个服务</span>
            <span className="text-emerald-400">{results.filter(r => r.ok).length} 正常</span>
            {results.some(r => !r.ok) && <span className="text-red-400">{results.filter(r => !r.ok).length} 异常</span>}
            <span className="text-zinc-500">平均延迟：{Math.round(results.reduce((s: number, r: any) => s + r.latencyMs, 0) / results.length)}ms</span>
          </div>
        </div>
      )}

      {/* ── 历史监测记录 ── */}
      <HealthHistory />
    </div>
  );
}

// ── 历史健康记录 ──
function HealthHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/model-health?page=1&limit=100');
        const data = await res.json();
        setHistory(data.logs || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="py-8 text-center text-xs text-zinc-600">加载历史记录...</div>;
  if (!history.length) return null;

  // 按服务名分组，取最近20条算成功率+平均延迟
  const grouped: Record<string, any[]> = {};
  for (const h of history) {
    if (!grouped[h.name]) grouped[h.name] = [];
    grouped[h.name].push(h);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">历史监测（近 {history.length} 条）</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(grouped).map(([name, logs]) => {
          const total = logs.length;
          const ok = logs.filter(l => l.ok).length;
          const rate = ((ok / total) * 100).toFixed(1);
          const avgLatency = Math.round(logs.reduce((s: number, l: any) => s + l.latencyMs, 0) / total);
          const lastOk = logs[0]?.ok;
          const lastLatency = logs[0]?.latencyMs || 0;

          return (
            <div key={name} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white truncate mr-2">{name}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lastOk ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {lastOk ? '正常' : '异常'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-zinc-500">成功率</p>
                  <p className={`text-sm font-bold ${parseFloat(rate) >= 95 ? 'text-emerald-400' : parseFloat(rate) >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{rate}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">平均延迟</p>
                  <p className="text-sm font-bold text-zinc-300">{avgLatency < 1000 ? `${avgLatency}ms` : `${(avgLatency/1000).toFixed(1)}s`}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">检测次数</p>
                  <p className="text-sm font-bold text-zinc-300">{total}</p>
                </div>
              </div>
              {/* 最近10条延迟mini chart */}
              <div className="flex items-end gap-px h-6">
                {logs.slice(0, 10).reverse().map((l: any, i: number) => {
                  const maxL = Math.max(...logs.slice(0, 10).map((x: any) => x.latencyMs), 1);
                  const h = Math.max(2, (l.latencyMs / maxL) * 100);
                  return (
                    <div key={i} className="flex-1 rounded-t"
                      style={{ height: `${h}%`, background: l.ok ? '#10b981' : '#ef4444' }}
                      title={`${new Date(l.createdAt).toLocaleString('zh-CN')}: ${l.latencyMs}ms ${l.ok ? '✓' : '✕'}`}
                    />
                  );
                })}
              </div>
              <p className="text-[9px] text-zinc-600 text-right">最近10次 ←</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TracesTab: 交互链路追踪 ──────────────────────────────────────────────

function TracesTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterTraceId, setFilterTraceId] = useState('');
  const [filterStep, setFilterStep] = useState('');
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterTraceId) params.set('traceId', filterTraceId);
      if (filterStep) params.set('step', filterStep);
      const res = await fetch(`/api/admin/interactions?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filterTraceId, filterStep]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // 按traceId分组
  const traceGroups: Record<string, typeof logs> = {};
  for (const log of logs) {
    if (!traceGroups[log.traceId]) traceGroups[log.traceId] = [];
    traceGroups[log.traceId].push(log);
  }
  const traceIds = Object.keys(traceGroups);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">交互链路追踪</h2>
        <button onClick={fetchLogs} className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 刷新
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <input
          value={filterTraceId}
          onChange={e => { setFilterTraceId(e.target.value); setPage(1); }}
          placeholder="搜索traceId..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-violet-500"
        />
        <select
          value={filterStep}
          onChange={e => { setFilterStep(e.target.value); setPage(1); }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-violet-500"
        >
          <option value="">全部步骤</option>
          <option value="user_input">用户输入</option>
          <option value="intent_analysis">意图分析</option>
          <option value="prompt_build">Prompt构造</option>
          <option value="llm_call">LLM调用</option>
          <option value="image_request">图片请求</option>
          <option value="image_response">图片响应</option>
          <option value="error">错误</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <div className="text-xs text-zinc-500">总日志</div>
          <div className="text-lg font-bold text-zinc-100">{total}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <div className="text-xs text-zinc-500">独立会话</div>
          <div className="text-lg font-bold text-zinc-100">{traceIds.length}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <div className="text-xs text-zinc-500">有标记</div>
          <div className="text-lg font-bold text-amber-400">{logs.filter((l: any) => l.reviewFlag).length}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <div className="text-xs text-zinc-500">错误</div>
          <div className="text-lg font-bold text-red-400">{logs.filter((l: any) => l.reviewFlag === 'error').length}</div>
        </div>
      </div>

      {/* Trace Groups */}
      {loading && <div className="text-center text-zinc-500 py-8">加载中...</div>}
      {!loading && traceIds.length === 0 && (
        <div className="text-center text-zinc-500 py-8">暂无交互日志</div>
      )}
      {traceIds.map(tid => {
        const steps = traceGroups[tid];
        const firstStep = steps[0];
        const isExpanded = expandedTrace === tid;
        const hasError = steps.some((s: any) => s.step === 'error' || s.reviewFlag === 'error');
        const hasWarning = steps.some((s: any) => s.reviewFlag === 'warning');
        const hasImage = steps.some((s: any) => s.imageUrl);
        const imageCount = steps.filter((s: any) => s.step === 'image_response' && s.imageUrl).length;
        const totalLatency = steps.reduce((acc: number, s: any) => acc + (s.imageLatencyMs || s.llmLatencyMs || 0), 0);

        return (
          <div key={tid} className={`rounded-xl border ${hasError ? 'border-red-800/50' : hasWarning ? 'border-amber-800/50' : 'border-zinc-800'} bg-zinc-900 overflow-hidden`}>
            {/* Trace Header */}
            <button
              onClick={() => setExpandedTrace(isExpanded ? null : tid)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${hasError ? 'bg-red-900/50 text-red-300' : hasWarning ? 'bg-amber-900/50 text-amber-300' : 'bg-zinc-800 text-zinc-400'}`}>
                  {tid.slice(0, 8)}
                </span>
                <span className="text-xs text-zinc-400">{firstStep.source || 'unknown'}</span>
                <span className="text-xs text-zinc-400">{firstStep.brandName || '—'}</span>
                {hasImage && <span className="text-xs text-emerald-400">{imageCount}图</span>}
                {totalLatency > 0 && <span className="text-xs text-zinc-500">{(totalLatency / 1000).toFixed(1)}s</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{steps.length}步</span>
                <span className="text-xs text-zinc-600">{new Date(firstStep.createdAt).toLocaleString('zh-CN')}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>
            </button>

            {/* Expanded Steps */}
            {isExpanded && (
              <div className="border-t border-zinc-800">
                {steps
                  .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((step: any, i: number) => (
                    <div key={step.id} className={`px-4 py-3 border-b border-zinc-800/50 ${step.step === 'error' ? 'bg-red-950/20' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-mono">{i + 1}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          step.step === 'error' ? 'bg-red-900/50 text-red-300' :
                          step.step === 'user_input' ? 'bg-blue-900/50 text-blue-300' :
                          step.step === 'intent_analysis' ? 'bg-violet-900/50 text-violet-300' :
                          step.step === 'prompt_build' ? 'bg-amber-900/50 text-amber-300' :
                          step.step === 'llm_call' ? 'bg-cyan-900/50 text-cyan-300' :
                          step.step === 'image_request' ? 'bg-orange-900/50 text-orange-300' :
                          step.step === 'image_response' ? 'bg-emerald-900/50 text-emerald-300' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>{step.step}</span>
                        {step.step === 'llm_call' && step.llmLatencyMs && <span className="text-xs text-zinc-500">{step.llmLatencyMs}ms</span>}
                        {step.step === 'image_response' && step.imageLatencyMs && <span className="text-xs text-zinc-500">{step.imageLatencyMs}ms</span>}
                        {step.reviewFlag && <span className={`text-[10px] px-1.5 py-0.5 rounded ${step.reviewFlag === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-amber-900/50 text-amber-300'}`}>⚠ {step.reviewFlag}</span>}
                      </div>

                      {/* Step content */}
                      {step.userInput && (
                        <div className="ml-7 mb-1">
                          <span className="text-[10px] text-zinc-500">用户输入</span>
                          <p className="text-xs text-zinc-300 mt-0.5">{step.userInput}</p>
                        </div>
                      )}
                      {step.userImageRef && (
                        <div className="ml-7 mb-1">
                          <span className="text-[10px] text-zinc-500">参考图</span>
                          {step.userImageRef.startsWith('data:') ? (
                            <img src={step.userImageRef.slice(0, 100)} alt="" className="w-12 h-12 rounded object-cover mt-0.5" />
                          ) : /^https?:\/\//.test(step.userImageRef) ? (
                            <a href={step.userImageRef} target="_blank" rel="noreferrer">
                              <img src={step.userImageRef} alt="参考图" className="w-16 h-16 rounded object-cover mt-0.5 border border-zinc-700 hover:border-violet-500 transition-colors" />
                            </a>
                          ) : (
                            <p className="text-xs text-zinc-400 mt-0.5 truncate">{step.userImageRef}</p>
                          )}
                        </div>
                      )}
                      {step.intent && (
                        <div className="ml-7 mb-1">
                          <span className="text-[10px] text-zinc-500">意图</span>
                          <p className="text-xs text-violet-300 mt-0.5 font-medium">{step.intent}</p>
                          {step.intentDetail && <p className="text-xs text-zinc-500 mt-0.5">{step.intentDetail.slice(0, 200)}</p>}
                        </div>
                      )}
                      {step.llmPrompt && (
                        <div className="ml-7 mb-1">
                          <span className="text-[10px] text-zinc-500">Prompt</span>
                          <pre className="text-xs text-amber-200/80 mt-0.5 bg-amber-950/20 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">{step.llmPrompt.slice(0, 2000)}</pre>
                        </div>
                      )}
                      {step.llmResponse && (
                        <div className="ml-7 mb-1">
                          <span className="text-[10px] text-zinc-500">LLM响应</span>
                          <pre className="text-xs text-cyan-200/80 mt-0.5 bg-cyan-950/20 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">{step.llmResponse.slice(0, 500)}</pre>
                        </div>
                      )}
                      {step.llmModel && (
                        <span className="ml-7 text-[10px] text-zinc-600">模型: {step.llmModel}</span>
                      )}
                      {step.imageModel && (
                        <span className="ml-7 text-[10px] text-zinc-600 mr-3">图片模型: {step.imageModel}</span>
                      )}
                      {step.imageUrl && (
                        <div className="ml-7 mb-1">
                          <span className="text-[10px] text-zinc-500">生成图片</span>
                          <img src={step.imageUrl} alt="" className="w-16 h-16 rounded object-cover mt-0.5 border border-zinc-700" />
                        </div>
                      )}
                      {step.imageError && (
                        <div className="ml-7 mb-1">
                          <span className="text-[10px] text-zinc-500">错误</span>
                          <p className="text-xs text-red-300 mt-0.5">{step.imageError}</p>
                        </div>
                      )}
                      {step.scene && (
                        <span className="ml-7 text-[10px] text-zinc-500 mr-3">场景: {step.scene.slice(0, 50)}</span>
                      )}
                      {step.platform && (
                        <span className="ml-7 text-[10px] text-zinc-500 mr-3">平台: {step.platform}</span>
                      )}
                      {step.ratio && (
                        <span className="ml-7 text-[10px] text-zinc-500 mr-3">比例: {step.ratio}</span>
                      )}
                      {step.reviewNote && (
                        <div className="ml-7 mt-2">
                          <span className="text-[10px] text-amber-500">审查备注</span>
                          <p className="text-xs text-amber-300 mt-0.5">{step.reviewNote}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30">上一页</button>
          <span className="text-xs text-zinc-500">{page}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30">下一页</button>
        </div>
      )}
    </div>
  );
}
