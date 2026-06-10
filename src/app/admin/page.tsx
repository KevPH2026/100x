'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, Image as ImageIcon, Ticket, Settings,
  Search, Copy, Trash2, Plus, ChevronLeft, ChevronRight,
  Lock, Check, X, AlertCircle, RefreshCw, Eye, GitBranch,
  Save, RotateCcw, ChevronDown, ChevronUp
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
  { key: 'assets', label: '素材库', icon: ImageIcon },
  { key: 'invites', label: '邀请码', icon: Ticket },
  { key: 'workflows', label: '工作流', icon: GitBranch },
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
          {tab === 'assets' && <AssetsTab />}
          {tab === 'invites' && <InvitesTab />}
          {tab === 'workflows' && <WorkflowsTab />}
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
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuota, setEditQuota] = useState('');
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">用户管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索邮箱/姓名" className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none focus:border-violet-500 w-56" />
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="text-xs text-zinc-500">共 {total} 个用户</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                <th className="text-left py-3 font-medium">邮箱</th>
                <th className="text-left py-3 font-medium">姓名</th>
                <th className="text-left py-3 font-medium">公司</th>
                <th className="text-left py-3 font-medium">电话</th>
                <th className="text-right py-3 font-medium">配额</th>
                <th className="text-right py-3 font-medium">已用</th>
                <th className="text-right py-3 font-medium">剩余</th>
                <th className="text-right py-3 font-medium">素材</th>
                <th className="text-left py-3 font-medium">状态</th>
                <th className="text-right py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                  <td className="py-3 text-white text-sm">{u.email}</td>
                  <td className="py-3 text-zinc-300 text-sm">{u.name || '—'}</td>
                  <td className="py-3 text-zinc-400 text-sm">{u.company || '—'}</td>
                  <td className="py-3 text-zinc-400 text-sm">{u.phone || '—'}</td>
                  <td className="py-3 text-right">
                    {editingId === u.id ? (
                      <input type="number" value={editQuota} onChange={e => setEditQuota(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && updateQuota(u.id)}
                        className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-xs text-right outline-none" autoFocus />
                    ) : <span className="text-white">{u.quotaTotal}</span>}
                  </td>
                  <td className="py-3 text-right text-zinc-400">{u.quotaUsed}</td>
                  <td className="py-3 text-right text-zinc-400">{Math.max(0, u.quotaTotal - u.quotaUsed)}</td>
                  <td className="py-3 text-right text-zinc-400">{u._count.assets}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.disabled ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                      {u.disabled ? '禁用' : '正常'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === u.id ? (
                        <>
                          <button onClick={() => updateQuota(u.id)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(u.id); setEditQuota(String(u.quotaTotal)); }}
                            className="text-xs text-violet-400 hover:text-violet-300">调配额</button>
                          <button onClick={() => toggleDisabled(u)}
                            className={`text-xs ${u.disabled ? 'text-emerald-400' : 'text-red-400'} hover:opacity-80`}>
                            {u.disabled ? '启用' : '禁用'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Assets ─────────────────────────────────────────────────────
function AssetsTab() {
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit), search });
    const res = await fetch(`/api/admin/assets?${q}`).then(r => r.json());
    setAssets(res.assets ?? []);
    setTotal(res.total ?? 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const deleteAsset = async (id: string) => {
    if (!confirm('确认删除此素材？')) return;
    await fetch(`/api/admin/assets?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">素材库</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索品牌/用户邮箱" className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white outline-none focus:border-violet-500 w-56" />
        </div>
      </div>

      {loading ? <Loading /> : (
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
      )}

      {/* Preview modal */}
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
