'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Clock, Zap, Check, Gift, Crown, Eye, Palette, LayoutGrid, Smartphone, Monitor, Camera, Video } from 'lucide-react';

const BRAND_SHOWCASES = [
  {
    id: 'glowskin',
    name: 'GlowSkin',
    category: '美妆护肤',
    market: '🇺🇸 北美',
    product: '72小时持妆气垫粉底',
    dna: {
      colors: ['#F4A261', '#E76F51', '#2A9D8F', '#F8E8DD'],
      style: 'warm, elegant, minimal',
      mood: '自信、自然光泽感',
    },
    platforms: [
      { name: 'IG Feed', ratio: '1:1', icon: Camera, image: '/demo/beauty_01.webp', scene: '晨间化妆场景 · 自然光' },
      { name: 'Story', ratio: '9:16', icon: Smartphone, image: '/demo/beauty_03.webp', scene: '开箱惊喜 · 手持展示' },
      { name: 'FB Ad', ratio: '16:9', icon: Monitor, image: '/demo/beauty_02.webp', scene: '产品平铺 · 极简背景' },
      { name: 'TikTok', ratio: '9:16', icon: Video, image: '/demo/beauty_04.webp', scene: '使用前后 · 对比展示' },
    ],
    insight: '暖色调+自然光场景，北美美妆市场CTR提升35%',
  },
  {
    id: 'soundwave',
    name: 'SoundWave',
    category: '3C科技',
    market: '🇪🇺 欧洲',
    product: '主动降噪无线耳机',
    dna: {
      colors: ['#264653', '#2A9D8F', '#E9C46A', '#1A1A2E'],
      style: 'cool, modern, clean',
      mood: '科技感、专业、沉浸',
    },
    platforms: [
      { name: 'IG Feed', ratio: '1:1', icon: Camera, image: '/demo/tech_01.webp', scene: '极简产品 · 深色背景' },
      { name: 'Story', ratio: '9:16', icon: Smartphone, image: '/demo/tech_02.webp', scene: '户外场景 · 城市背景' },
      { name: 'FB Ad', ratio: '16:9', icon: Monitor, image: '/demo/tech_03.webp', scene: '功能特写 · 细节展示' },
      { name: 'Google', ratio: '16:9', icon: LayoutGrid, image: '/demo/tech_06.webp', scene: '生活方式 · 工作场景' },
    ],
    insight: '冷色调+极简构图，欧洲科技品类转化率提升28%',
  },
  {
    id: 'beancraft',
    name: 'BeanCraft',
    category: '食品饮料',
    market: '🇯🇵 日本',
    product: '单一产地手冲咖啡豆',
    dna: {
      colors: ['#6B4423', '#A0522D', '#D4A574', '#F5F0E8'],
      style: 'warm, rustic, handcrafted',
      mood: '匠心、温暖、仪式感',
    },
    platforms: [
      { name: 'IG Feed', ratio: '1:1', icon: Camera, image: '/demo/coffee_01.webp', scene: '冲泡过程 · 蒸汽升腾' },
      { name: 'Story', ratio: '9:16', icon: Smartphone, image: '/demo/coffee_02.webp', scene: '豆袋质感 · 手工标签' },
      { name: 'FB Ad', ratio: '16:9', icon: Monitor, image: '/demo/coffee_03.webp', scene: '早晨时光 · 阳光桌面' },
      { name: 'TikTok', ratio: '9:16', icon: Video, image: '/demo/coffee_04.webp', scene: '拉花艺术 · 慢镜头' },
    ],
    insight: '暖棕色调+手工质感，日本食品类目收藏率提升42%',
  },
  {
    id: 'novaring',
    name: 'NovaRing',
    category: '珠宝配饰',
    market: '🇺🇸 北美',
    product: '智能健康监测戒指',
    dna: {
      colors: ['#1A1A2E', '#4A4E69', '#9A8C98', '#C9ADA7'],
      style: 'dark, premium, tech-forward',
      mood: '未来感、高端、神秘',
    },
    platforms: [
      { name: 'IG Feed', ratio: '1:1', icon: Camera, image: '/demo/ring_01.webp', scene: '产品特写 · 金属光泽' },
      { name: 'Story', ratio: '9:16', icon: Smartphone, image: '/demo/ring_02.webp', scene: '佩戴效果 · 手部展示' },
      { name: 'FB Ad', ratio: '16:9', icon: Monitor, image: '/demo/ring_03.webp', scene: '科技感 · 数据光效' },
      { name: 'Google', ratio: '16:9', icon: LayoutGrid, image: '/demo/ring_04.webp', scene: '健康数据 · 可视化' },
    ],
    insight: '深色背景+金属质感，北美配饰类目加购率提升31%',
  },
  {
    id: 'fitpulse',
    name: 'FitPulse',
    category: '运动户外',
    market: '🇪🇺 欧洲',
    product: '智能运动追踪手环',
    dna: {
      colors: ['#E63946', '#F1FAEE', '#457B9D', '#1D3557'],
      style: 'bold, active, vibrant',
      mood: '活力、动感、挑战',
    },
    platforms: [
      { name: 'IG Feed', ratio: '1:1', icon: Camera, image: '/demo/sport_01.webp', scene: '运动场景 · 动态捕捉' },
      { name: 'Story', ratio: '9:16', icon: Smartphone, image: '/demo/sport_02.webp', scene: '跑步瞬间 · 汗水闪光' },
      { name: 'FB Ad', ratio: '16:9', icon: Monitor, image: '/demo/sport_03.webp', scene: '健身房 · 力量展示' },
      { name: 'TikTok', ratio: '9:16', icon: Video, image: '/demo/sport_04.webp', scene: '成就分享 · 数据庆祝' },
    ],
    insight: '高饱和色+动态构图，欧洲运动品类分享率提升55%',
  },
  {
    id: 'mechx',
    name: 'MechX',
    category: '智能硬件',
    market: '🇨🇳 中国',
    product: '桌面协作机器人',
    dna: {
      colors: ['#0D1B2A', '#1B263B', '#415A77', '#778DA9'],
      style: 'mechanical, precise, futuristic',
      mood: '工业感、精准、未来',
    },
    platforms: [
      { name: 'IG Feed', ratio: '1:1', icon: Camera, image: '/demo/robot_01.webp', scene: '产品外观 · 机械结构' },
      { name: 'Story', ratio: '9:16', icon: Smartphone, image: '/demo/robot_02.webp', scene: '工作演示 · 协作场景' },
      { name: 'FB Ad', ratio: '16:9', icon: Monitor, image: '/demo/robot_03.webp', scene: '细节特写 · 精密工艺' },
      { name: 'Google', ratio: '16:9', icon: LayoutGrid, image: '/demo/robot_04.webp', scene: '团队画面 · 人机协作' },
    ],
    insight: '工业蓝灰+精密细节，B2B类目询盘率提升47%',
  },
];

const PAIN_POINTS = [
  { icon: '⏰', title: '一张素材做3天', desc: '找参考、写brief、等设计、改稿...上新节奏被素材拖垮' },
  { icon: '💸', title: '外包一张¥300起', desc: '按月结算动辄上万，旺季加急还要翻倍' },
  { icon: '🎨', title: '模板工具千篇一律', desc: 'Canva生成的素材没有品牌感，用户一眼看出是模板' },
  { icon: '📱', title: '多平台尺寸改到崩溃', desc: 'IG要1:1，Story要9:16，FB要16:9，一张图改8个版本' },
];

const TESTIMONIALS = [
  {
    name: '林薇', role: 'DTC品牌创始人', brand: 'GlowSkin', avatar: '👩‍💼',
    content: '以前上新前一周就开始焦虑素材，现在30分钟搞定一整套。最惊喜的是AI真的懂我们的品牌调性，不是套模板。',
    metric: '素材产出速度提升 20x',
  },
  {
    name: 'Mark Chen', role: '跨境电商运营总监', brand: 'SoundWave', avatar: '👨‍💻',
    content: '我们测试过5个AI生图工具，100x是唯一一个能稳定输出商用级质量的。欧洲市场的素材直接能用，不需要二次修图。',
    metric: '外包成本降低 85%',
  },
  {
    name: 'Sarah Zhang', role: '独立站卖家', brand: 'BeanCraft', avatar: '☕',
    content: '一个人管产品、运营、客服，根本没有时间做素材。100x让我终于可以把精力放回产品和用户上。',
    metric: '每周节省 15+ 小时',
  },
];

export default function DemoPage() {
  const [activeBrand, setActiveBrand] = useState(0);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const showcase = BRAND_SHOWCASES[activeBrand];

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-violet-500/30 overflow-x-hidden">
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50"
        style={{ background: 'rgba(5,5,7,0.85)', backdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <span className="text-[9px] font-black text-white">100x</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white/90">100x</span>
          </a>
          <a href="/" className="text-xs text-white/30 hover:text-white/60 transition-all">← 返回首页</a>
        </div>
      </nav>

      <main className="pt-14">

        {/* Hero */}
        <section className="relative pt-20 pb-16 px-6">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.9)' }}>
              <Sparkles className="w-3 h-3" />
              AI生成广告素材 · 多平台一键覆盖
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              <span className="text-white">DTC品牌做素材</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                不该这么痛苦
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/30 max-w-xl mx-auto leading-relaxed mb-8">
              你负责打造好产品和品牌调性，
              <span className="text-white/50"> AI负责把卖点变成能卖的素材。</span>
              <br />
              <span className="text-white/15 text-sm">品牌DNA注入 · 多平台一键生成 · 商用级品质</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/get"
                className="group inline-flex items-center gap-2.5 text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)', padding: '14px 36px', borderRadius: '14px' }}>
                <Gift className="w-4 h-4" />
                免费生成素材
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <span className="text-xs text-white/15">注册即送 100 张/天</span>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">这些场景，你熟悉吗？</p>
              <h2 className="text-2xl md:text-3xl font-black text-white">素材是DTC的瓶颈，不是你的错</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {PAIN_POINTS.map((p, i) => (
                <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
                      <p className="text-xs text-white/25 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Showcase */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">真实案例</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">一套品牌DNA，生成全平台素材</h2>
              <p className="text-sm text-white/25">6个品类 · 同一品牌调性 · 覆盖所有投放场景</p>
            </div>

            {/* 品牌选择器 */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {BRAND_SHOWCASES.map((b, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveBrand(i); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: activeBrand === i ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                    border: activeBrand === i ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    color: activeBrand === i ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)',
                  }}>
                  <span className="mr-1.5">{b.category}</span>
                  <span className="text-white/20">{b.name}</span>
                </button>
              ))}
            </div>

            {/* 品牌展示卡片 */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
              
              {/* 品牌头部信息 */}
              <div className="p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.03))' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-black text-white">{showcase.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: 'rgba(139,92,246,0.15)', color: 'rgba(196,181,253,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        {showcase.market}
                      </span>
                    </div>
                    <p className="text-sm text-white/40">{showcase.product}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-[10px] text-white/30">品牌DNA</span>
                    </div>
                    <div className="flex gap-1.5">
                      {showcase.dna.colors.map((c, i) => (
                        <div key={i} className="group relative">
                          <div className="w-6 h-6 rounded-lg" style={{ background: c }} />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                            style={{ background: 'rgba(0,0,0,0.8)' }}>
                            {c}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-[11px] text-white/20">
                  <span>风格: {showcase.dna.style}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>情绪: {showcase.dna.mood}</span>
                </div>
              </div>

              {/* 素材矩阵 */}
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-white">全平台素材矩阵</span>
                    <span className="text-[10px] text-white/20 ml-2">{showcase.platforms.length}个尺寸 · 同一品牌调性</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400/60">
                    <Zap className="w-3 h-3" />
                    {showcase.insight}
                  </div>
                </div>

                {/* 平台素材卡片 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {showcase.platforms.map((platform, i) => {
                    const Icon = platform.icon;
                    return (
                      <div key={i} className="group relative rounded-2xl overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={() => setHoveredImage(`${activeBrand}-${i}`)}
                        onMouseLeave={() => setHoveredImage(null)}>
                        <div className="relative aspect-square">
                          <img src={platform.image} alt={platform.scene} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className={`absolute inset-0 flex flex-col justify-end p-3 transition-opacity duration-300 ${
                            hoveredImage === `${activeBrand}-${i}` ? 'opacity-100' : 'opacity-0'
                          }`} style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}>
                            <p className="text-[11px] font-bold text-white mb-0.5">{platform.scene}</p>
                            <p className="text-[9px] text-white/40">AI生成 · 未修图</p>
                          </div>
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Icon className="w-3 h-3 text-white/60" />
                            <span className="text-[10px] font-medium text-white/70">{platform.name}</span>
                          </div>
                          <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/50"
                            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                            {platform.ratio}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 底部数据洞察 */}
                <div className="mt-6 p-4 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <Eye className="w-4 h-4 text-violet-400 shrink-0" />
                  <p className="text-xs text-white/40">
                    <span className="text-white/60 font-medium">投放洞察：</span>
                    {showcase.insight}。同一套品牌DNA确保所有平台素材视觉统一，避免"每个平台像不同品牌"的尴尬。
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-white/15 mt-6">
              点击上方品类标签，查看不同行业的品牌素材方案
            </p>
          </div>
        </section>

        {/* 生成流程 */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">工作流程</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">3步生成，30秒出图</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: '注入品牌DNA', desc: '上传品牌参考图或输入URL，AI自动提取色彩、风格、情绪关键词', icon: Palette },
                { step: '02', title: '输入产品信息', desc: '填写产品名称、卖点、目标市场，AI理解你的商业意图', icon: Sparkles },
                { step: '03', title: '一键生成矩阵', desc: '自动输出IG/FB/TikTok/Google全平台尺寸，风格统一', icon: Zap },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="relative p-6 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-4xl font-black mb-4" style={{ color: 'rgba(139,92,246,0.15)' }}>{item.step}</div>
                    <Icon className="w-6 h-6 text-violet-400 mb-3" />
                    <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-white/25 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs text-violet-400/80 font-medium uppercase tracking-[4px] mb-3">他们已经在用了</p>
              <h2 className="text-2xl md:text-3xl font-black text-white">卖家真实反馈</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="p-6 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: 'rgba(139,92,246,0.1)' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-[11px] text-white/25">{t.role} · {t.brand}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/35 leading-relaxed mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-violet-400" />
                    <span className="text-[11px] font-medium text-violet-300">{t.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 relative">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Crown className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              开始生成你的品牌素材
            </h2>
            <p className="text-white/25 mb-2">注册即送每天100张免费额度</p>
            <p className="text-xs text-white/15 mb-8">无需信用卡 · 随时取消</p>

            <a href="/get"
              className="group inline-flex items-center gap-2.5 text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 40px rgba(139,92,246,0.35)', padding: '16px 44px', borderRadius: '16px' }}>
              <Gift className="w-4 h-4" />
              免费开始生成
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-[5px] font-black text-white">100x</span>
              </div>
              <span className="text-xs text-white/10">100x.pics</span>
            </div>
            <p className="text-xs text-white/8">© 2026 100x</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
