'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, Check, Zap, Crown, MessageSquare, X } from 'lucide-react';

type Lang = 'zh' | 'en';

const T = {
  zh: {
    badge: '全球首个主动创意引擎',
    heroLine1: '你的广告素材',
    heroLine2: '我们包了',
    heroSub: 'AI 主动理解你的品牌，主动生成广告创意。',
    heroNote: '不需要你告诉 AI 做什么。AI 看一眼产品图，就知道该做什么。',
    cta: '免费生成',
    ctaSub: '直接使用 · 无需等待',
    navHow: '使用方法',
    getStarted: '开始使用',
    howTitle: '三步搞定。就这样。',
    howLabel: '使用方法',
    steps: [
      { icon: '🎨', title: '上传参考', desc: '分享你的品牌风格图', detail: 'AI自动解码品牌DNA' },
      { icon: '✍️', title: '描述产品', desc: '一句话核心卖点', detail: '越具体效果越好' },
      { icon: '⚡', title: '生成素材', desc: '多张素材，多平台覆盖', detail: 'IG / Story / FB / TikTok 全覆盖' },
    ],
    footer: '© 2026 100x',
    demoCaption: '真实AI生成 · 未经修改',
    planLabel: '选择方案',
    planTitle: '按需选择，随时升级',
    plans: [
      {
        name: '体验',
        badge: '免注册',
        price: '¥0',
        period: '直接使用',
        desc: '试试看，直接生成',
        features: ['AI生成1次', '品牌DNA解码', '全平台尺寸'],
        cta: '立即试用',
        highlight: false,
      },
      {
        name: '免费',
        badge: '注册即用',
        price: '¥0',
        period: '注册免费',
        desc: '注册并认证，解锁更多',
        features: ['AI生成100次', '品牌DNA解码', '全平台尺寸', '一键下载全部素材'],
        cta: '免费注册',
        highlight: true,
      },
      {
        name: 'Pro',
        badge: '即将上线',
        price: '',
        period: '敬请期待',
        desc: '专业卖家首选，无限素材产出',
        features: [
          '无限AI生成', '品牌DNA解码', '全平台尺寸',
          '批量导出 & 水印', '多品牌管理', '优先生成速度',
        ],
        cta: '预约通知',
        highlight: false,
      },
    ],
    ctaMain: '开始生成',
    ctaSub2: '已上线 · 免费使用',
  },
  en: {
    badge: 'The First Proactive Creative Engine',
    heroLine1: 'Your ad creatives,',
    heroLine2: 'we got this.',
    heroSub: 'AI that proactively understands your brand and generates creatives.',
    heroNote: "You don't tell AI what to do. AI looks at your product and knows.",
    cta: 'Generate Free',
    ctaSub: 'No sign-up · Download instantly',
    navHow: 'How it works',
    getStarted: 'Get Started',
    howTitle: "Three steps. That's it.",
    howLabel: 'How it works',
    steps: [
      { icon: '🎨', title: 'Upload Reference', desc: 'Share your brand style image', detail: 'AI decodes your brand DNA' },
      { icon: '✍️', title: 'Describe Product', desc: 'One-line core selling point', detail: 'The more specific, the better' },
      { icon: '⚡', title: 'Generate', desc: 'Multi-platform creatives', detail: 'IG / Story / FB / TikTok covered' },
    ],
    footer: '© 2026 100x',
    demoCaption: 'Real AI output · Unedited',
    planLabel: 'PRICING',
    planTitle: 'Pick your plan, scale anytime',
    plans: [
      {
        name: 'Trial',
        badge: 'No Sign-up',
        price: '$0',
        period: 'No account needed',
        desc: 'Try it now, generate instantly',
        features: ['1 AI generation', 'Brand DNA decode', 'All platform sizes'],
        cta: 'Try Now',
        highlight: false,
      },
      {
        name: 'Free',
        badge: 'Sign Up',
        price: '$0',
        period: 'Free with account',
        desc: 'Sign up & verify to unlock more',
        features: ['100 AI generations', 'Brand DNA decode', 'All platform sizes', 'One-click download all'],
        cta: 'Sign Up Free',
        highlight: true,
      },
      {
        name: 'Pro',
        badge: 'Coming Soon',
        price: '',
        period: 'Coming Soon',
        desc: 'For serious sellers, unlimited creatives',
        features: [
          'Unlimited AI generations', 'Brand DNA decode', 'All platform sizes',
          'Batch export & watermark', 'Multi-brand management', 'Priority generation speed',
        ],
        cta: 'Notify Me',
        highlight: false,
      },
    ],
    ctaMain: 'Generate Now',
    ctaSub2: 'Live now · Free to use',
  },
};

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection({ lang }: { lang: Lang }) {
  const t = T[lang];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 md:p-12 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-violet-400 border border-violet-500/20 bg-violet-500/5 mb-6">
        <Zap className="w-3.5 h-3.5" />
        {t.ctaSub2}
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
        {lang === 'zh' ? '现在就开始生成' : 'Start Generating Now'}
      </h2>

      <p className="text-sm text-zinc-500 mb-8 max-w-md mx-auto">
        {lang === 'zh'
          ? '无需等待，立即体验AI生成品牌素材'
          : 'No waiting. Experience AI-powered brand creatives now.'}
      </p>

      <a href="/chat"
        className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 px-8 py-3.5 rounded-lg transition-colors">
        <Sparkles className="w-4 h-4" />
        {t.ctaMain}
        <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
      </a>
    </div>
  );
}

// ─── Data Types & Demo Data ──────────────────────────────────────────────────

type ImgRatio = 'square' | 'wide' | 'tall';

interface DemoImage {
  src: string;
  label: string;
  ratio: ImgRatio;
}

interface DemoSeries {
  name: string;
  category: string;
  emoji: string;
  tagline: string;
  scenes: string;
  images: DemoImage[];
}

const DEMO_SERIES: DemoSeries[] = [
  {
    name: 'SoundWave',
    category: '降噪耳机',
    emoji: '🎧',
    tagline: 'Immersive Silence · Portable Concert Hall',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/tech_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/tech_02.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/tech_03.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/tech_06.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'AuraGlow',
    category: '美妆护肤',
    emoji: '🧴',
    tagline: 'Natural Glow · Radiance in One Touch',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/beauty_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/beauty_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/beauty_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/beauty_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'BeanCraft',
    category: '精品咖啡',
    emoji: '☕',
    tagline: 'Specialty Pour-Over · Every Cup is a Ritual',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/coffee_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/coffee_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/coffee_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/coffee_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'StridePro',
    category: '运动鞋',
    emoji: '👟',
    tagline: 'Lightweight Cushion · Break Every Limit',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/sport_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/sport_03.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/sport_02.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/sport_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'NexBot',
    category: '智能机器人',
    emoji: '🤖',
    tagline: 'Smart Living · Your AI Home Companion',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/robot_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/robot_02.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/robot_03.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/robot_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
  {
    name: 'RingFit',
    category: '智能戒指',
    emoji: '💍',
    tagline: 'Wearable Intelligence · Health on Your Finger',
    scenes: 'IG Feed × Story × FB Ad × TikTok',
    images: [
      { src: '/demo/ring_01.webp', label: 'IG Feed 1:1', ratio: 'square' },
      { src: '/demo/ring_02.webp', label: 'Story 9:16', ratio: 'tall' },
      { src: '/demo/ring_03.webp', label: 'FB Ad 16:9', ratio: 'wide' },
      { src: '/demo/ring_04.webp', label: 'FB Ad 16:9', ratio: 'wide' },
    ],
  },
];

const AD_COPY: Record<string, { headline: string; sub: string; cta: string }[]> = {
  SoundWave: [
    { headline: 'Silence The Noise', sub: 'Up to 98% noise cancellation', cta: 'GET YOURS →' },
    { headline: '30 Hours of Bliss', sub: 'All-day battery. Zero downtime.', cta: 'SHOP NOW →' },
    { headline: "Hear What You've Been Missing", sub: 'Hi-Res Audio · Spatial Sound', cta: 'TRY FREE →' },
    { headline: 'Sound That Moves You', sub: '360° Spatial Audio', cta: 'TRY FREE →' },
  ],
  AuraGlow: [
    { headline: 'Glow Different', sub: 'Visible results in 7 days', cta: 'SHOP NOW →' },
    { headline: 'Your Skin But Better', sub: 'Clinical-grade glow serum', cta: 'TRY FREE →' },
    { headline: 'No Filter Needed', sub: '72-hour hydration boost', cta: 'GET YOURS →' },
    { headline: 'Wake Up Glowing', sub: 'Overnight radiance reset', cta: 'SHOP NOW →' },
  ],
  BeanCraft: [
    { headline: 'Every Cup Tells a Story', sub: 'Single-origin specialty roast', cta: 'ORDER NOW →' },
    { headline: 'From Farm to Your Cup', sub: 'Ethically sourced · Freshly roasted', cta: 'TRY TODAY →' },
    { headline: 'Ritual, Not Routine', sub: 'Hand-roasted in small batches', cta: 'SUBSCRIBE →' },
    { headline: 'Mornings Worth Waking Up For', sub: 'Award-winning blend', cta: 'ORDER NOW →' },
  ],
  StridePro: [
    { headline: 'Lighter Than Air', sub: 'Only 180g · Cloud-like cushion', cta: 'SHOP NOW →' },
    { headline: 'Break Your Limits', sub: 'Energy-return sole tech', cta: 'GET YOURS →' },
    { headline: 'From Streets to Tracks', sub: 'StridePro X · Limited Edition', cta: 'PRE-ORDER →' },
    { headline: 'Unleash Your Speed', sub: 'Carbon fiber plate · 3% faster', cta: 'SHOP NOW →' },
  ],
  NexBot: [
    { headline: 'Your Home, Reimagined', sub: 'Voice-controlled smart living', cta: 'MEET NEXBOT →' },
    { headline: 'Welcome Home', sub: 'AI that learns your routine', cta: 'EXPLORE →' },
    { headline: 'One Voice, Full Control', sub: 'Lights · Music · Security · Climate', cta: 'GET YOURS →' },
    { headline: 'Smarter Every Day', sub: 'OTA updates · Always improving', cta: 'SHOP NOW →' },
  ],
  RingFit: [
    { headline: 'Health Meets Style', sub: 'Advanced biometrics on your finger', cta: 'DISCOVER →' },
    { headline: 'Sleep Smarter', sub: 'Track every sleep stage', cta: 'LEARN MORE →' },
    { headline: 'Your Body, Quantified', sub: 'Heart rate · SpO2 · Stress · Steps', cta: 'GET YOURS →' },
    { headline: ' Invisible. Powerful.', sub: '3-day battery · IP68 waterproof', cta: 'SHOP NOW →' },
  ],
};

function AdTextOverlay({ copy }: { copy: { headline: string; sub: string; cta: string } }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
      <div className="space-y-1">
        <p className="text-white font-bold text-sm md:text-base leading-tight">
          {copy.headline}
        </p>
        <p className="text-zinc-400 text-[10px] md:text-xs">
          {copy.sub}
        </p>
        <span className="inline-block mt-1 px-2.5 py-1 rounded text-[9px] md:text-[10px] font-semibold text-white bg-violet-600/80">
          {copy.cta}
        </span>
      </div>
    </div>
  );
}

function CarouselGrid({ series }: { series: DemoSeries }) {
  const copies = AD_COPY[series.name] || [];
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-zinc-800">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        <span className="text-sm">{series.emoji}</span>
        <span className="text-sm text-zinc-400 font-medium">{series.category}</span>
        <span className="text-[10px] text-zinc-600 font-mono ml-auto">{series.name}</span>
      </div>

      {/* Grid */}
      <div className="p-3 md:p-4">
        <div className="grid gap-1.5 md:gap-2"
          style={{
            gridTemplateColumns: '1fr 1fr 2fr',
            gridTemplateRows: '1fr 1fr',
            gridTemplateAreas: '"sq tall wide1" "info tall wide2"',
          }}>
          {/* Square image */}
          {(() => {
            const img = series.images.find(i => i.ratio === 'square');
            const copy = copies[series.images.indexOf(img!)];
            if (!img) return null;
            return (
              <div className="group relative rounded-lg overflow-hidden cursor-pointer border border-zinc-800 hover:border-zinc-700 transition-colors"
                style={{ gridArea: 'sq' }}>
                <div className="aspect-square">
                  <img src={img.src} alt={`${series.name} ${img.label}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
                {copy && <AdTextOverlay copy={copy} />}
              </div>
            );
          })()}
          {/* Tall image */}
          {(() => {
            const img = series.images.find(i => i.ratio === 'tall');
            const copy = copies[series.images.indexOf(img!)];
            if (!img) return null;
            return (
              <div className="group relative rounded-lg overflow-hidden cursor-pointer border border-zinc-800 hover:border-zinc-700 transition-colors"
                style={{ gridArea: 'tall' }}>
                <div className="aspect-[9/16] h-full">
                  <img src={img.src} alt={`${series.name} ${img.label}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
                {copy && <AdTextOverlay copy={copy} />}
              </div>
            );
          })()}
          {/* Wide images */}
          {series.images.filter(img => img.ratio === 'wide').map((img, idx) => {
            const area = `wide${idx + 1}`;
            const copy = copies[series.images.indexOf(img)];
            return (
              <div key={area} className="group relative rounded-lg overflow-hidden cursor-pointer border border-zinc-800 hover:border-zinc-700 transition-colors"
                style={{ gridArea: area }}>
                <div className="aspect-video">
                  <img src={img.src} alt={`${series.name} ${img.label}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
                {copy && <AdTextOverlay copy={copy} />}
              </div>
            );
          })}
          {/* Info cell */}
          <div className="rounded-lg p-4 flex flex-col justify-between bg-zinc-900/60 border border-zinc-800"
            style={{ gridArea: 'info' }}>
            <div>
              <p className="text-[11px] font-mono tracking-[3px] text-violet-500 mb-2">{series.name.toUpperCase()}</p>
              <p className="text-sm font-semibold text-zinc-300 leading-snug mb-1">{series.tagline}</p>
              <p className="text-[11px] text-zinc-600">{series.category}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-800">
              {['1:1', '9:16', '16:9'].map((s, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded text-zinc-500 font-medium bg-zinc-800/50 border border-zinc-700/50">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [activeSeries, setActiveSeries] = useState(0);
  const [fbOpen, setFbOpen] = useState(false);
  const [fbContent, setFbContent] = useState('');
  const [fbContact, setFbContact] = useState('');
  const [fbSending, setFbSending] = useState(false);
  const [fbSent, setFbSent] = useState(false);
  const t = T[lang];
  const total = DEMO_SERIES.length;

  const next = useCallback(() => setActiveSeries(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setActiveSeries(i => (i - 1 + total) % total), [total]);

  const submitFb = async () => {
    if (!fbContent.trim() || fbSending) return;
    setFbSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fbContent.trim(), page: '/landing', contact: fbContact.trim() || undefined }),
      });
      if (res.ok) {
        setFbSent(true);
        setTimeout(() => { setFbOpen(false); setFbContent(''); setFbContact(''); setFbSent(false); }, 1500);
      }
    } catch {}
    setFbSending(false);
  };

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const series = DEMO_SERIES[activeSeries];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-violet-500/30 overflow-x-hidden">

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center">
              <span className="text-[8px] font-black text-white tracking-tight">100x</span>
            </div>
            <span className="text-sm font-semibold text-white">100x</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#demo" className="hover:text-white transition-colors">演示</a>
            <a href="#how" className="hover:text-white transition-colors">{t.navHow}</a>
            <a href="#pricing" className="hover:text-white transition-colors">定价</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-700 transition-colors">
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
            <a href="/chat" className="h-8 px-4 rounded-md text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 flex items-center gap-1.5 transition-colors">
              {t.getStarted}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-violet-400 border border-violet-500/20 bg-violet-500/5 mb-10">
            <Sparkles className="w-3.5 h-3.5" />
            {t.badge}
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] mb-8">
            <span className="text-white">{t.heroLine1}</span>
            <br />
            <span className="text-violet-400">
              {t.heroLine2}
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed mb-3">
            {t.heroSub}
          </p>
          <p className="text-sm text-zinc-600 mb-12">
            {t.heroNote}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/chat" className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 px-8 py-3.5 rounded-lg transition-colors">
              {t.cta}
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="flex -space-x-1.5">
                {['bg-violet-500', 'bg-cyan-500', 'bg-amber-500', 'bg-emerald-500'].map((c, i) => (
                  <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-zinc-950`} />
                ))}
              </div>
              {t.ctaSub}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pain Points ─── */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-violet-400 font-medium uppercase tracking-[4px] mb-4">
              {lang === 'zh' ? 'DTC卖家的真实困境' : 'THE REAL STRUGGLE'}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {lang === 'zh' ? '品味和效率，真的只能二选一？' : 'Taste or Speed? Why Not Both.'}
            </h2>
            <p className="text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
              {lang === 'zh'
                ? '你花三个月打磨产品，花一周调品牌调性，最后却在素材上妥协——因为好设计太慢，快设计太丑'
                : 'You spend months perfecting the product, weeks nailing the brand vibe — then compromise on creatives because good design is too slow and fast design is too ugly.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '⏰', title: lang === 'zh' ? '一张素材做3天' : '3 Days Per Creative', desc: lang === 'zh' ? '找参考、写brief、等设计、改稿...上新节奏被素材拖垮' : 'Reference hunting, brief writing, waiting for designers, revisions... launch speed killed by creative bottleneck' },
              { icon: '💸', title: lang === 'zh' ? '外包一张¥300起' : '$40+ Per Asset', desc: lang === 'zh' ? '按月结算动辄上万，旺季加急还要翻倍' : 'Monthly bills hit thousands. Rush fees double in peak season.' },
              { icon: '🎨', title: lang === 'zh' ? '模板工具千篇一律' : 'Templates Look Generic', desc: lang === 'zh' ? 'Canva生成的素材没有品牌感，用户一眼看出是模板' : 'Canva outputs lack brand soul. Customers spot templates instantly.' },
              { icon: '📱', title: lang === 'zh' ? '多平台尺寸改到崩溃' : '8 Versions Per Image', desc: lang === 'zh' ? 'IG要1:1，Story要9:16，FB要16:9，一张图改8个版本' : 'IG needs 1:1, Story 9:16, FB 16:9... one image, eight versions.' },
            ].map((p, i) => (
              <div key={i} className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{p.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1.5">{p.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Proactive vs Reactive ─── */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-violet-400 font-medium uppercase tracking-[4px] mb-4">
              {lang === 'zh' ? '为什么是「主动」' : 'WHY PROACTIVE'}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {lang === 'zh' ? '传统工具等你下指令，100x 主动为你创造' : 'Other tools wait for orders. 100x creates for you.'}
            </h2>
            <p className="text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
              {lang === 'zh'
                ? '传统设计工具是「你描述，它执行」。100x 是「它理解，它创造，它推荐」'
                : 'Traditional tools: you describe, they execute. 100x: it understands, it creates, it recommends.'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {/* 被动 */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm">😴</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-300">{lang === 'zh' ? '传统方式' : 'Traditional'}</p>
                  <p className="text-[11px] text-zinc-600">{lang === 'zh' ? '被动执行' : 'Reactive'}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {(lang === 'zh' ? [
                  '你需要写详细的 prompt',
                  '你需要自己选场景、选尺寸',
                  '你需要一个个手动导出',
                  '你需要判断哪个素材更好',
                  '你需要反复修改才能用',
                ] : [
                  'You write detailed prompts',
                  'You pick scenes and sizes manually',
                  'You export one by one',
                  'You judge which creative works',
                  'You iterate repeatedly before it\'s usable',
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-500">
                    <span className="text-zinc-700 mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* 主动 */}
            <div className="p-6 rounded-xl border border-violet-500/30 bg-violet-500/5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm">⚡</div>
                <div>
                  <p className="text-sm font-semibold text-violet-300">{lang === 'zh' ? '100x 方式' : '100x'}</p>
                  <p className="text-[11px] text-violet-500">{lang === 'zh' ? '主动创造' : 'Proactive'}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {(lang === 'zh' ? [
                  'AI 主动解码品牌 DNA，理解你的风格',
                  'AI 主动推荐适配的场景和平台',
                  'AI 一次生成全套尺寸，批量就绪',
                  'AI 主动评估素材质量，挑出最好的',
                  '开箱即用，无需修改',
                ] : [
                  'AI decodes your brand DNA automatically',
                  'AI recommends scenes and platforms for you',
                  'AI generates all sizes in one batch',
                  'AI evaluates quality and picks the best',
                  'Ready to use — no revision needed',
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <span className="text-violet-400 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Demo Carousel ─── */}
      <section id="demo" className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-[5px] mb-1">Generated by 100x</p>
          <p className="text-center text-xs text-zinc-500 mb-8">{t.demoCaption}</p>

          <div className="relative">
            <CarouselGrid series={series} />
            <button onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-5 w-9 h-9 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:border-zinc-600 transition-colors">
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <button onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-5 w-9 h-9 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:border-zinc-600 transition-colors">
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            {DEMO_SERIES.map((s, i) => (
              <button key={i} onClick={() => setActiveSeries(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i === activeSeries
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'
                }`}>
                <span className="text-[11px]">{s.emoji}</span>
                <span className="hidden sm:inline text-[11px]">{s.category}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-violet-400 font-medium uppercase tracking-[4px] mb-4">
              {lang === 'zh' ? '真实卖家反馈' : 'SELLER STORIES'}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {lang === 'zh' ? '素材质量，他们说了算' : 'Quality Speaks for Itself'}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: lang === 'zh' ? '林薇' : 'Vivian Lin', role: lang === 'zh' ? 'DTC品牌创始人' : 'DTC Brand Founder', brand: 'GlowSkin', avatar: '👩‍💼',
                content: lang === 'zh'
                  ? '以前上新前一周就开始焦虑素材，现在30分钟搞定一整套。最惊喜的是AI真的懂我们的品牌调性，不是套模板。'
                  : 'I used to stress about creatives a week before every launch. Now I get a full set in 30 minutes. The AI actually understands our brand vibe — not just templates.',
                metric: lang === 'zh' ? '素材产出速度提升 20x' : '20x faster creative output'
              },
              {
                name: 'Mark Chen', role: lang === 'zh' ? '跨境电商运营总监' : 'Cross-border Ops Director', brand: 'SoundWave', avatar: '👨‍💻',
                content: lang === 'zh'
                  ? '我们测试过5个AI生图工具，100x是唯一一个能稳定输出商用级质量的。欧洲市场的素材直接能用，不需要二次修图。'
                  : 'We tested 5 AI image tools. 100x is the only one that consistently delivers commercial-grade quality. European market assets are ready to use — no retouching needed.',
                metric: lang === 'zh' ? '外包成本降低 85%' : '85% reduction in outsourcing costs'
              },
              {
                name: 'Sarah Zhang', role: lang === 'zh' ? '独立站卖家' : 'Solo Store Owner', brand: 'BeanCraft', avatar: '☕',
                content: lang === 'zh'
                  ? '一个人管产品、运营、客服，根本没有时间做素材。100x让我终于可以把精力放回产品和用户上。'
                  : 'I handle product, ops, and customer service alone — no time for creatives. 100x lets me focus back on product and customers.',
                metric: lang === 'zh' ? '每周节省 15+ 小时' : '15+ hours saved per week'
              },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-zinc-800">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role} · {t.brand}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-5">"{t.content}"</p>
                <div className="flex items-center gap-1.5 pt-4 border-t border-zinc-800">
                  <Zap className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-medium text-violet-400">{t.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-violet-400 font-medium uppercase tracking-[4px] mb-4">{t.howLabel}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t.howTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.steps.map((s, i) => (
              <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xl bg-zinc-800 border border-zinc-700">
                    {s.icon}
                  </div>
                  <span className="text-xs font-mono text-zinc-600">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-400 mb-1.5">{s.desc}</p>
                <p className="text-xs text-zinc-600">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-violet-400 font-medium uppercase tracking-[4px] mb-4">{t.planLabel}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t.planTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {t.plans.map((plan, i) => (
              <div key={i}
                className={`relative rounded-xl p-7 flex flex-col border transition-colors ${
                  plan.highlight
                    ? 'border-violet-500/40 bg-violet-500/5'
                    : 'border-zinc-800 bg-zinc-900/30'
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-violet-600 text-white">
                      <Crown className="w-3 h-3" /> {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    {plan.highlight
                      ? <Zap className="w-5 h-5 text-violet-400" />
                      : <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700" />
                    }
                    <span className="text-lg font-semibold text-white">{plan.name}</span>
                    {!plan.highlight && (
                      <span className="text-[10px] text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    {plan.price ? (
                      <span className={`text-4xl md:text-5xl font-bold ${plan.highlight ? 'text-violet-300' : 'text-white'}`}>
                        {plan.price}
                      </span>
                    ) : (
                      <span className="text-2xl md:text-3xl font-bold text-zinc-600">
                        {lang === 'zh' ? '敬请期待' : 'Coming Soon'}
                      </span>
                    )}
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-zinc-500">{plan.desc}</p>
                </div>
                <div className="border-t border-zinc-800 mb-6" />
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-violet-400' : 'text-zinc-600'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/chat"
                  className={`group inline-flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-lg px-6 py-3 transition-colors ${
                    plan.highlight
                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}>
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            <span className="text-white">{t.heroLine1}</span>
            <br />
            <span className="text-violet-400">{t.heroLine2}</span>
          </h2>
          <p className="text-zinc-500 mb-10">{t.heroSub}</p>
          <a href="/chat" className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 px-10 py-4 rounded-lg transition-colors">
            {t.cta}
            <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-violet-600 flex items-center justify-center">
              <span className="text-[4px] font-black text-white">100x</span>
            </div>
            <span className="text-xs text-zinc-600">100pics.today</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setFbOpen(!fbOpen)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />反馈
            </button>
            <a href="https://dtclab.org/" target="__blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">DTCLab</a>
            <a href="https://dtc.doctor/" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">DTC Doctor</a>
            <p className="text-xs text-zinc-700">{t.footer}</p>
          </div>
        </div>
      </footer>

      {/* ── 反馈浮窗 ── */}
      {fbOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl overflow-hidden"
          style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs font-bold text-white/70">反馈问题</span>
            <button onClick={() => setFbOpen(false)}><X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" /></button>
          </div>
          <div className="p-3 space-y-2">
            {fbSent ? (
              <div className="text-center py-4">
                <Check className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-emerald-400">感谢反馈！</p>
              </div>
            ) : (
              <>
                <textarea value={fbContent} onChange={e => setFbContent(e.target.value)} placeholder="描述问题或建议..." rows={3}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder:text-white/25 outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <input value={fbContact} onChange={e => setFbContact(e.target.value)} placeholder="联系方式（可选）"
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder:text-white/25 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={submitFb} disabled={!fbContent.trim() || fbSending}
                  className="w-full py-2 rounded-lg text-xs font-bold text-white disabled:opacity-30 transition-all"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  {fbSending ? '提交中...' : '提交反馈'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
