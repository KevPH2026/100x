'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Download, LogOut, Zap, Image as ImageIcon, User, ChevronRight, LayoutGrid } from 'lucide-react';

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="100x" className="w-7 h-7" />
          <span className="font-bold text-lg">100x</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/get" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
            生成素材 <ChevronRight className="w-3 h-3" />
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            退出
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold">
            {(userData?.name || session.user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{userData?.name || '我的账户'}</h1>
            <p className="text-zinc-500 text-sm">{session.user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {/* Quota */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Zap className="w-4 h-4 text-violet-400" />
                生成配额
              </div>
              <span className="text-sm font-mono">
                <span className="text-white font-semibold">{userData?.quotaUsed ?? 0}</span>
                <span className="text-zinc-600"> / {userData?.quotaTotal ?? 0}</span>
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700"
                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-zinc-600">
              <span>已用 {quotaPercent}%</span>
              <span>剩余 {userData?.quotaRemaining ?? 0} 张</span>
            </div>
          </div>

          {/* Assets count */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              已生成素材
            </div>
            <div className="text-3xl font-bold">{userData?.assets?.length ?? 0}</div>
            <div className="text-xs text-zinc-600 mt-1">张广告素材</div>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-zinc-400" />
            我的素材库
          </h2>
          <a href="/get" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
            + 生成新素材
          </a>
        </div>

        {!userData?.assets || userData.assets.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-16 text-center">
            <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm mb-4">还没有生成过素材</p>
            <a
              href="/get"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
            >
              <Zap className="w-4 h-4" />
              立即生成
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {userData.assets.map(asset => (
              <div key={asset.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  <img
                    src={asset.imageUrl}
                    alt={asset.sceneLabel}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={asset.imageUrl}
                      download={`${asset.brandName}-${asset.sceneLabel}.jpg`}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white/20 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </a>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-medium text-zinc-300 truncate">{asset.brandName}</div>
                  <div className="text-xs text-zinc-600 truncate">{asset.sceneLabel} · {asset.platform}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
