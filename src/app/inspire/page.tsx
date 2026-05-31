'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shuffle, ArrowRight, Zap, Target, Palette, Layout, MessageSquare, TrendingUp, Check } from 'lucide-react';
import { CATEGORIES, getRandomCapsule, type Capsule } from '@/lib/capsules';

export default function InspirePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShake = () => {
    if (!selectedCategory) return;
    setIsShaking(true);
    
    // 动画延迟后出结果
    setTimeout(() => {
      let newCapsule: Capsule;
      do {
        newCapsule = getRandomCapsule(selectedCategory);
      } while (history.includes(newCapsule.id) && history.length < 5);
      
      setCapsule(newCapsule);
      setHistory(prev => [...prev.slice(-4), newCapsule.id]);
      setIsShaking(false);
    }, 600);
  };

  const handleUseThis = () => {
    if (!capsule) return;
    // 跳转到生成页面，带上胶囊参数
    const params = new URLSearchParams({
      style: capsule.style,
      hook: capsule.hooks[0],
      composition: capsule.composition,
      colorScheme: capsule.colorScheme,
    });
    router.push(`/get?${params.toString()}`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 overflow-x-hidden">
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Mesh orbs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed top-[200px] right-[-300px] w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', filter: 'blur(100px)' }} />

      {/* Header */}
      <div className="relative z-10 pt-8 pb-4 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.9)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            灵感胶囊
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
            没灵感？摇一颗
          </h1>
          <p className="text-white/30 text-sm">
            专为投放团队设计的创意方向库 · 36颗胶囊 · 即摇即用
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-20">
        {/* Step 1: 选品类 */}
        {!capsule && (
          <div className="mb-8">
            <p className="text-xs text-white/20 font-medium mb-4 tracking-wider">STEP 1 · 选择你的品类</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-violet-500/20 border-violet-500/40'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                  style={{ border: '1px solid' }}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs text-white/50">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 摇一摇 */}
        {!capsule && selectedCategory && (
          <div className="text-center">
            <p className="text-xs text-white/20 font-medium mb-4 tracking-wider">STEP 2 · 摇出灵感</p>
            <button
              onClick={handleShake}
              disabled={isShaking}
              className="relative w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all"
              style={{
                background: 'linear-gradient(145deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))',
                border: '2px solid rgba(139,92,246,0.3)',
                boxShadow: '0 0 40px rgba(139,92,246,0.15)',
              }}
            >
              <div className={`transition-transform duration-500 ${isShaking ? 'animate-spin' : ''}`}>
                <Shuffle className="w-10 h-10 text-violet-400" />
              </div>
              {!isShaking && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-white/30">点击摇一摇</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Loading */}
        {isShaking && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/30">正在调配灵感...</p>
          </div>
        )}

        {/* Capsule Result */}
        {capsule && !isShaking && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 胶囊卡片 */}
            <div className="rounded-2xl overflow-hidden mb-6"
              style={{
                background: 'linear-gradient(145deg, rgba(139,92,246,0.08), rgba(6,182,212,0.04))',
                border: '1px solid rgba(139,92,246,0.2)',
                boxShadow: '0 0 60px rgba(139,92,246,0.1)',
              }}>
              {/* 参考图 */}
              <div className="relative aspect-video bg-black/40">
                <img 
                  src={capsule.demoImage} 
                  alt={capsule.style}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,7,0.9) 0%, transparent 50%)' }} />
                
                {/* 风格标签 */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {capsule.platform}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {capsule.stage}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10">
                      {capsule.aspectRatio}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white">{capsule.style}</h2>
                </div>
              </div>

              {/* 详情 */}
              <div className="p-5 space-y-4">
                {/* 构图 */}
                <div className="flex items-start gap-3">
                  <Layout className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-1">构图建议</p>
                    <p className="text-sm text-white/70">{capsule.composition}</p>
                  </div>
                </div>

                {/* 配色 */}
                <div className="flex items-start gap-3">
                  <Palette className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-1">配色方向</p>
                    <p className="text-sm text-white/70">{capsule.colorScheme}</p>
                  </div>
                </div>

                {/* 文案钩子 */}
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-2">文案钩子（选一句）</p>
                    <div className="space-y-1.5">
                      {capsule.hooks.map((hook, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                          <span className="w-1 h-1 rounded-full bg-violet-400/60" />
                          {hook}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 为什么有效 */}
                <div className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-1">为什么有效</p>
                    <p className="text-sm text-white/70">{capsule.why}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCapsule(null);
                  setHistory([]);
                  setSelectedCategory(null);
                }}
                className="flex-1 h-12 rounded-xl text-sm font-medium text-white/50 flex items-center justify-center gap-2 transition-all hover:text-white/70"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Shuffle className="w-4 h-4" />
                重新选择
              </button>
              <button
                onClick={handleShake}
                className="flex-1 h-12 rounded-xl text-sm font-medium text-white/50 flex items-center justify-center gap-2 transition-all hover:text-white/70"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Zap className="w-4 h-4" />
                再摇一颗
              </button>
              <button
                onClick={handleUseThis}
                className="flex-[2] h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.3)',
                }}
              >
                <Target className="w-4 h-4" />
                用这套生成素材
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
