'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, Image as ImageIcon, Ticket, Settings,
  Search, Copy, Trash2, Plus, ChevronLeft, ChevronRight,
  Lock, Check, X, AlertCircle, RefreshCw, Eye, GitBranch,
  Save, RotateCcw, ChevronDown, ChevronUp, Ghost, FileText,
  Activity
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
          {tab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const cards = [
    { label: '总用户', value: stats?.totalUsers ?? 0 },
    { label: '活跃用户(7d)', value: stats?.activeUsers ?? 0 },
    { label: '总素材', value: stats?.totalAssets ?? 0 },
    { label: '今日生成', value: stats?.todayAssets ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">概览</h2>
      <div className="grid grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">平均生成/用户</p>
          <p className="text-xl font-bold text-white">{stats?.avgPerUser?.toFixed(1) ?? '—'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">配额使用率</p>
          <p className="text-xl font-bold text-white">{(stats?.quotaUsageRate ?? 0).toFixed(1)}%</p>
        </div>
      </div>
      {/* Daily chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-xs text-zinc-500 mb-4">近7天每日生成量</p>
        <div className="flex items-end gap-2 h-32">
          {(stats?.dailyGenerations ?? []).map(d => {
            const max = Math.max(...(stats?.dailyGenerations?.map(x => x.count) || [1]), 1);
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
      return;
    }
    setExpandedId(userId);
    setExpandLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/detail`).then(r => r.json());
      setExpandedDetail({
        brands: res.brands ?? [],
        memories: res.memories ?? [],
        recentAssets: res.recentAssets ?? [],
        quota: res.quota ?? { total: 0, used: 0, remaining: 0, usageRate: 0 },
        stats: res.stats ?? { totalAssets: 0, totalBrands: 0, totalMemories: 0 },
      });
    } catch { setExpandedDetail(null); }
    setExpandLoading(false);
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
                  <div className="flex-1 min-w-0 grid grid-cols-8 gap-2 items-center">
                    <div className="col-span-2 min-w-0">
                      <p className="text-sm text-white truncate">{u.email}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{u.name || '—'}</p>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{u.company || '—'}</p>
                    <p className="text-xs text-zinc-400 truncate">{u.phone || '—'}</p>
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
                      <button onClick={() => toggleDisabled(u)}
                        className={`text-[10px] ${u.disabled ? 'text-emerald-400' : 'text-red-400'} hover:opacity-80`}>
                        {u.disabled ? '启用' : '禁用'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === u.id && (
                  <div className="bg-zinc-900/50 border-b border-zinc-800/50 px-6 py-4">
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
    const res = await fetch('/api/admin/invites', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: genCount, quota: genQuota, notePrefix: genNote }),
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
function SettingsTab() {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(d => { setConfig(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const c = (config as Record<string, Record<string, unknown>>)?.adforge100x || {};

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">系统配置</h2>
      <p className="text-xs text-zinc-500">API Key等敏感配置。运行时参数（模型/温度/限流）请到「工作流」Tab调整。</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Novart API Key</label>
          <p className="text-sm text-zinc-400 font-mono">{c.novartKey ? '••••••••' + String(c.novartKey).slice(-6) : '未配置'}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Novart Base URL</label>
          <p className="text-sm text-zinc-400 font-mono">{String(c.novartBaseUrl || '未配置')}</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">TokenRouter API Key</label>
          <p className="text-sm text-zinc-400 font-mono">{(c as any).tokenrouterKey ? '••••••••' : '未配置'}</p>
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
    </div>
  );
}
