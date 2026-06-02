'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { Sparkles, Zap, Check, Download, AlertCircle, ImagePlus, X, Loader2, Link2, Globe, ChevronDown, User, LogOut, LayoutDashboard, Wand2, Palette, Target, Heart, Clock, MousePointerClick, RefreshCw, Scissors } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) {
    return (
      <a href="/login" className="text-xs text-white/40 hover:text-white/70 transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20">
        <User className="w-3 h-3" />登录
      </a>
    );
  }

  const initial = (session.user.name || session.user.email || 'U')[0].toUpperCase();
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {initial}
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl py-1 text-sm">
            <div className="px-3 py-2 border-b border-zinc-800">
              <div className="text-white/80 truncate text-xs">{session.user.email}</div>
            </div>
            <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-800 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" />我的素材库
            </a>
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:bg-zinc-800 transition-colors">
              <LogOut className="w-3.5 h-3.5" />退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const FALLBACK_SCENES = [
  { label: '晨间生活', desc: 'lifestyle morning routine, natural light', aspectRatio: '1:1', platform: 'IG Feed' },
  { label: '户外黄金时段', desc: 'outdoor golden hour, active lifestyle', aspectRatio: '9:16', platform: 'IG Story' },
  { label: '开箱惊喜', desc: 'unboxing moment, excited expression', aspectRatio: '1:1', platform: 'IG Feed' },
  { label: '使用对比', desc: 'before and after transformation', aspectRatio: '16:9', platform: 'FB / Google' },
  { label: '产品平铺', desc: 'flat lay product photography', aspectRatio: '3:2', platform: 'Pinterest' },
  { label: '极简产品', desc: 'minimalist product on marble', aspectRatio: '1:1', platform: 'IG Feed' },
  { label: '促销氛围', desc: 'festive sale atmosphere', aspectRatio: '9:16', platform: 'TikTok' },
  { label: '户外场景', desc: 'scenic outdoor landscape', aspectRatio: '16:9', platform: 'YouTube' },
];

const FALLBACK_GOALS = [
  { id: 'awareness', label: '品牌曝光' },
  { id: 'promo', label: '促销转化' },
  { id: 'launch', label: '新品发布' },
  { id: 'retention', label: '复购召回' },
  { id: 'ugc', label: '用户口碑' },
];
const FALLBACK_MOODS = [
  { id: 'energetic', label: '活力 / 兴奋' },
  { id: 'calm', label: '平静 / 治愈' },
  { id: 'luxe', label: '高级 / 精致' },
  { id: 'warm', label: '温暖 / 治愈' },
  { id: 'bold', label: '大胆 / 张扬' },
  { id: 'minimal', label: '极简 / 干净' },
];
const FALLBACK_URGENCIES = [
  { id: 'none', label: '无紧迫' },
  { id: 'low', label: '轻度' },
  { id: 'high', label: '强烈' },
];

interface ScrapeData {
  title: string;
  description: string;
  images: string[];
  brand: string;
  keywords: string[];
  price?: string;
  sourceUrl: string;
}

interface BrandDNA {
  industry?: string;
  colors: { primary: string; secondary: string; accent: string; palette: string[]; mood: string };
  style: { mood: string; tone: string; aesthetic: string; photography: string; typography: string };
  keywords: string[];
  description: string;
}

interface SceneItem { label: string; desc: string; aspectRatio: string; platform: string }
interface PresetItem { id: string; label: string; desc?: string }

interface GeneratedImage {
  url: string;
  platform: string;
  scene: string;
  ratio: string;
  refining?: boolean;
  refineHistory?: Array<{ url: string; instruction: string }>;
}

export default function GeneratePage() {
  const { status } = useSession();
  const [step, setStep] = useState<'form' | 'generating' | 'result'>('form');
  const [formStep, setFormStep] = useState(1); // 1=产品 2=营销 3=场景 4=确认

  // 配置（从后台拉）
  const [scenes, setScenes] = useState<SceneItem[]>(FALLBACK_SCENES);
  const [goals, setGoals] = useState<PresetItem[]>(FALLBACK_GOALS);
  const [moods, setMoods] = useState<PresetItem[]>(FALLBACK_MOODS);
  const [urgencies, setUrgencies] = useState<PresetItem[]>(FALLBACK_URGENCIES);

  // URL 解析
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeData, setScrapeData] = useState<ScrapeData | null>(null);
  const [scrapeError, setScrapeError] = useState('');
  const [selectedRefImageIdx, setSelectedRefImageIdx] = useState<number>(0);

  // 品牌 DNA
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [isExtractingDNA, setIsExtractingDNA] = useState(false);

  // 智能场景推荐
  const [isRecommendingScenes, setIsRecommendingScenes] = useState(false);
  const [scenesRecommended, setScenesRecommended] = useState(false);

  // 表单
  const [brandName, setBrandName] = useState('');
  const [sellingPoint, setSellingPoint] = useState('');
  const [targetCountry, setTargetCountry] = useState('US');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<number[]>([0]);
  const [customScene, setCustomScene] = useState(''); // 用户自定义场景描述
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['IG Feed']);

  // 抠图（浏览器端 @imgly/background-removal）
  const [cutoutImage, setCutoutImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const removeBg = async (imageInput: string): Promise<string | null> => {
    setIsRemovingBg(true);
    try {
      // 从 CDN 加载 @imgly/background-removal（Turbopack 无法打包这个库）
      let removeBackground: (image: Blob | URL, config: any) => Promise<Blob>;
      if ((window as any).__imglyRemoveBackground) {
        removeBackground = (window as any).__imglyRemoveBackground;
      } else {
        // 动态加载 CDN
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.type = 'module';
          script.textContent = `
            import { removeBackground } from 'https://esm.sh/@imgly/background-removal@1.7.0';
            window.__imglyRemoveBackground = removeBackground;
            window.__imglyReady = true;
          `;
          script.onload = () => {
            const check = setInterval(() => {
              if ((window as any).__imglyReady) { clearInterval(check); resolve(); }
            }, 100);
            setTimeout(() => { clearInterval(check); reject(new Error('CDN load timeout')); }, 30000);
          };
          document.head.appendChild(script);
        });
        removeBackground = (window as any).__imglyRemoveBackground;
      }

      let blob: Blob;
      if (imageInput.startsWith('data:')) {
        const res = await fetch(imageInput);
        blob = await res.blob();
      } else {
        // 通过后端代理下载，避免 CORS
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageInput)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`proxy fetch failed: ${res.status}`);
        blob = await res.blob();
      }
      const resultBlob = await removeBackground(blob, {
        model: 'isnet_fp16',
        output: { format: 'image/png' },
      });
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setCutoutImage(dataUrl);
          resolve(dataUrl);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(resultBlob);
      });
    } catch (err) {
      console.error('[removeBg] failed:', err);
      return null;
    } finally {
      setIsRemovingBg(false);
    }
  };

  // 营销活动
  const [campaignTheme, setCampaignTheme] = useState('');
  const [marketingGoal, setMarketingGoal] = useState('awareness');
  const [mood, setMood] = useState('energetic');
  const [urgency, setUrgency] = useState('none');
  const [cta, setCta] = useState('立即购买');

  // 生成
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentScene, setCurrentScene] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 拉配置
  useEffect(() => {
    fetch('/api/config/public').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      if (d.scenes?.length) setScenes(d.scenes.map((s: any) => ({ label: s.label, desc: s.desc, aspectRatio: s.aspectRatio || '1:1', platform: s.platform || 'Ad' })));
      if (d.marketingGoals?.length) setGoals(d.marketingGoals);
      if (d.moods?.length) setMoods(d.moods);
      if (d.urgencies?.length) setUrgencies(d.urgencies);
    }).catch(() => { /* 用 fallback */ });
  }, []);

  // ── URL 解析 ─────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!urlInput.trim()) return;
    setIsScraping(true);
    setScrapeError('');
    setScrapeData(null);
    setBrandDNA(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setScrapeError(json.error || '解析失败');
        return;
      }

      const data: ScrapeData = json.data;
      setScrapeData(data);
      setSelectedRefImageIdx(0);
      if (data.brand && !brandName) setBrandName(data.brand);
      const desc = [data.title, data.description].filter(Boolean).join(' · ');
      if (desc && !sellingPoint) setSellingPoint(desc.slice(0, 200));

      if (data.images[0]) {
        setReferenceImage(data.images[0]);
        // 自动提取 DNA
        extractDNA(data.images[0]);
        // 自动抠图（浏览器端）
        removeBg(data.images[0]);
      }

      // 自动推荐场景（基于产品类型）
      recommendScenes({
        title: data.title,
        description: data.description,
        brand: data.brand,
        keywords: data.keywords,
      });
    } catch {
      setScrapeError('网络错误，请检查网址后重试');
    } finally {
      setIsScraping(false);
    }
  };

  // ── 智能场景推荐 ─────────────────────────────────────────────────
  const recommendScenes = async (info: {
    title?: string; description?: string; brand?: string;
    sellingPoint?: string; keywords?: string[]; category?: string;
  }) => {
    if (!info.title && !info.description && !info.sellingPoint) return;
    setIsRecommendingScenes(true);
    try {
      const res = await fetch('/api/recommend-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.scenes) && json.scenes.length >= 4) {
        setScenes(json.scenes);
        setSelectedScenes([0]);
        setScenesRecommended(true);
      }
    } catch (err) {
      console.error('recommend scenes failed', err);
    } finally {
      setIsRecommendingScenes(false);
    }
  };

  // ── 提取品牌 DNA ─────────────────────────────────────────────────
  const extractDNA = async (imageInput: string) => {
    setIsExtractingDNA(true);
    try {
      const res = await fetch('/api/brand-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageInput }),
      });
      const json = await res.json();
      if (res.ok && json.dna) {
        setBrandDNA(json.dna);
      }
    } catch (err) {
      console.error('DNA extract failed', err);
    } finally {
      setIsExtractingDNA(false);
    }
  };

  const handleSelectRefImage = (idx: number, imgUrl: string) => {
    setSelectedRefImageIdx(idx);
    setReferenceImage(imgUrl);
    setCutoutImage(null);
    extractDNA(imgUrl);
    removeBg(imgUrl);
  };

  // ── 文件上传 ─────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('图片大小不能超过5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setReferenceImage(dataUrl);
      setScrapeData(null);
      setCutoutImage(null);
      setError('');
      extractDNA(dataUrl);
      removeBg(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const toggleScene = (idx: number) => {
    setSelectedScenes(prev => {
      if (prev.includes(idx)) {
        return prev.length > 1 ? prev.filter(i => i !== idx) : prev;
      }
      return [...prev, idx];
    });
    setCustomScene('');
  };

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter(k => k !== key) : prev;
      }
      return [...prev, key];
    });
  };

  // ── 生成（多场景×多平台） ────────────────────────────────────────
  const generate = async () => {
    if (!brandName.trim() || !sellingPoint.trim()) {
      setError('品牌名和卖点必填'); return;
    }

    setStep('generating');
    setError('');
    setGeneratedImages([]);
    setProgress(0);

    const styleContext = scrapeData
      ? [
          scrapeData.keywords.length ? `Keywords: ${scrapeData.keywords.join(', ')}` : '',
          scrapeData.price ? `Price point: ${scrapeData.price}` : '',
        ].filter(Boolean).join('. ')
      : '';

    const moodObj = moods.find(m => m.id === mood);
    const goalObj = goals.find(g => g.id === marketingGoal);
    const urgencyObj = urgencies.find(u => u.id === urgency);

    // 构建场景×平台组合
    const sceneIndices = customScene.trim() ? [-1] : selectedScenes;
    const tasks: Array<{ sceneIdx: number; scene: SceneItem; platformKey: string }> = [];
    for (const si of sceneIndices) {
      const scene = si === -1
        ? { label: '自定义', desc: customScene.trim(), aspectRatio: '1:1', platform: selectedPlatforms[0] || 'IG Feed' }
        : scenes[si];
      if (!scene) continue;
      for (const pk of selectedPlatforms) {
        tasks.push({ sceneIdx: si, scene, platformKey: pk });
      }
    }

    const total = tasks.length;
    let done = 0;
    const results: GeneratedImage[] = [];

    for (const task of tasks) {
      setCurrentScene(task.scene.label + ' · ' + task.platformKey);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        const res = await fetch('/api/adforge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: brandName.trim(),
            sellingPoint: sellingPoint.trim(),
            targetCountry,
            referenceImage,
            cutoutImage: cutoutImage || undefined,
            styleContext,
            sceneIndex: task.sceneIdx,
            customSceneDesc: customScene.trim() || undefined,
            platformOverride: task.platformKey,
            campaignTheme: campaignTheme.trim(),
            marketingGoal: goalObj?.desc || goalObj?.label || marketingGoal,
            mood: moodObj?.desc || moodObj?.label || mood,
            urgency: urgencyObj?.desc || urgencyObj?.label || urgency,
            cta: cta.trim() || '立即购买',
            brandDNA,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Generate failed for', task.scene.label, err.error);
        } else {
          const data = await res.json();
          const imageUrl = data.image?.url;
          if (imageUrl) {
            results.push({
              url: imageUrl,
              platform: task.platformKey,
              scene: customScene.trim() || task.scene.label,
              ratio: data.image.ratio || task.scene.aspectRatio,
              refineHistory: [],
            });
            setGeneratedImages([...results]);
          }
        }
      } catch (err) {
        console.error('Generate error:', err);
      }
      done++;
      setProgress(Math.round((done / total) * 100));
    }

    setProgress(100);
    setStep('result');
  };

  // ── 自然语言再编辑 ───────────────────────────────────────────────
  const refineImage = async (idx: number, instruction: string) => {
    if (!instruction.trim()) return;
    const img = generatedImages[idx];
    if (!img) return;

    setGeneratedImages(prev => prev.map((p, i) => i === idx ? { ...p, refining: true } : p));

    try {
      const res = await fetch('/api/adforge/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageUrl: img.url,
          instruction: instruction.trim(),
          aspectRatio: img.ratio,
          brandDNA,
          brandName: brandName.trim(),
          scene: img.scene,
          platform: img.platform,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.image?.url) {
        setError(json.error || '再编辑失败');
        setGeneratedImages(prev => prev.map((p, i) => i === idx ? { ...p, refining: false } : p));
        return;
      }
      setGeneratedImages(prev => prev.map((p, i) => i === idx ? {
        ...p,
        refining: false,
        url: json.image.url,
        refineHistory: [...(p.refineHistory || []), { url: img.url, instruction }],
      } : p));
    } catch (err) {
      console.error('refine err', err);
      setError('再编辑出错');
      setGeneratedImages(prev => prev.map((p, i) => i === idx ? { ...p, refining: false } : p));
    }
  };

  // ── 生成中 ────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">AI 正在生成素材...</h2>
          <p className="text-white/40 mb-1">场景：{currentScene}</p>
          <p className="text-white/20 text-sm mb-8">约30-60秒，请耐心等待</p>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse"
              style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── 结果页 ────────────────────────────────────────────────────────
  if (step === 'result') {
    return (
      <div className="min-h-screen bg-[#050507] text-white">
        <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

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
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('form')} className="text-xs text-white/30 hover:text-white/60 transition-all">← 重新生成</button>
              <UserMenu />
            </div>
          </div>
        </nav>

        <main className="pt-20 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'rgba(74,222,128,0.9)' }}>
                <Check className="w-3 h-3" />
                生成完成
              </div>
              <h2 className="text-3xl font-black mb-2">{brandName} 的素材矩阵</h2>
              <p className="text-white/30">{generatedImages.length} 张素材 · 每张可自然语言再编辑</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatedImages.map((img, i) => (
                <ImageCard key={i} img={img} index={i}
                  brandName={brandName}
                  onRefine={refineImage}
                />
              ))}
            </div>

            {generatedImages.length === 0 && (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">生成失败，请重试</p>
                <button
                  onClick={() => setStep('form')}
                  className="mt-4 px-6 py-2 rounded-xl text-sm text-white/60 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  返回重试
                </button>
              </div>
            )}

            <div className="mt-10 text-center">
              <button
                onClick={() => setStep('form')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                <Zap className="w-4 h-4" />
                再生成一套
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── 表单页 ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

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
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-white/30 hover:text-white/60 transition-all">← 返回首页</a>
            <UserMenu />
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.9)' }}>
              <Sparkles className="w-3 h-3" />
              AI生成广告素材
            </div>
            <h1 className="text-3xl font-black mb-2">生成你的品牌素材</h1>
          </div>

          {/* ── 步骤指示器 ─────────────────────────────────── */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {[
              { n: 1, label: '产品信息' },
              { n: 2, label: '营销活动' },
              { n: 3, label: '使用场景' },
              { n: 4, label: '投放平台' },
            ].map((s, i) => (
              <Fragment key={s.n}>
                {i > 0 && <div className="w-8 h-px mx-1" style={{ background: formStep > s.n ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)' }} />}
                <button onClick={() => { if (s.n < formStep) setFormStep(s.n); }}
                  className="flex items-center gap-1.5 transition-all">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    formStep === s.n ? 'bg-violet-500 text-white' :
                    formStep > s.n ? 'bg-violet-500/30 text-violet-300' : 'bg-white/5 text-white/30'
                  }`}>
                    {formStep > s.n ? <Check className="w-3 h-3" /> : s.n}
                  </span>
                  <span className={`text-xs font-medium hidden sm:inline ${
                    formStep === s.n ? 'text-white/80' :
                    formStep > s.n ? 'text-violet-300/70' : 'text-white/20'
                  }`}>{s.label}</span>
                </button>
              </Fragment>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* ── Step 1: 产品信息 ─────────────────────────────────── */}
          {formStep === 1 && (
          <div className="space-y-6">
            {/* URL 解析 */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.04)' }}>
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-white/80">从产品网址解析（可选）</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScrape()}
                      placeholder="粘贴产品页网址，例如 allbirds.com/products/..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <button
                    onClick={handleScrape}
                    disabled={isScraping || !urlInput.trim()}
                    className="px-5 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                    {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isScraping ? '解析中...' : '解析'}
                  </button>
                </div>
                {scrapeError && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {scrapeError}
                  </p>
                )}
              </div>

              {scrapeData && (
                <div className="px-5 pb-5 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-3 mt-3">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">解析成功</span>
                    <span className="text-xs text-white/20 truncate">{scrapeData.sourceUrl}</span>
                  </div>
                  {scrapeData.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] text-white/30 mb-2">选择参考图（自动提取品牌DNA）</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {scrapeData.images.map((img, idx) => (
                          <button key={idx} onClick={() => handleSelectRefImage(idx, img)}
                            className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all"
                            style={{
                              border: selectedRefImageIdx === idx ? '2px solid rgba(139,92,246,0.8)' : '2px solid rgba(255,255,255,0.08)',
                            }}>
                            <img src={img} alt={`参考图${idx + 1}`} className="w-full h-full object-cover" />
                            {selectedRefImageIdx === idx && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.3)' }}>
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 品牌DNA */}
            {(brandDNA || isExtractingDNA) && (
              <div className="rounded-2xl overflow-hidden p-5" style={{ border: '1px solid rgba(244,114,182,0.25)', background: 'rgba(244,114,182,0.04)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-semibold text-white/80">品牌 DNA</span>
                  {isExtractingDNA && <Loader2 className="w-3 h-3 animate-spin text-pink-400" />}
                  <span className="ml-auto text-[10px] text-white/30">AI 自动提取，可手动调整</span>
                </div>
                {brandDNA && (
                  <div className="space-y-4">
                    {/* 色板 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-3 h-3 text-white/40" />
                        <span className="text-[11px] font-medium text-white/50">品牌色板</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {(brandDNA.colors?.palette || []).slice(0, 6).map((c, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className="w-12 h-12 rounded-lg" style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                            <span className="text-[9px] text-white/40 font-mono">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 风格四维度 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <DNAField label="美学风格" value={brandDNA.style?.aesthetic || ''}
                        onChange={v => setBrandDNA({ ...brandDNA, style: { ...brandDNA.style, aesthetic: v } })} />
                      <DNAField label="品牌情绪" value={brandDNA.style?.mood || ''}
                        onChange={v => setBrandDNA({ ...brandDNA, style: { ...brandDNA.style, mood: v } })} />
                      <DNAField label="品牌语调" value={brandDNA.style?.tone || ''}
                        onChange={v => setBrandDNA({ ...brandDNA, style: { ...brandDNA.style, tone: v } })} />
                      <DNAField label="摄影风格" value={brandDNA.style?.photography || ''}
                        onChange={v => setBrandDNA({ ...brandDNA, style: { ...brandDNA.style, photography: v } })} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 产品基础信息 */}
            <div className="rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white/80">产品信息</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">品牌名称 *</label>
                <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)}
                  placeholder="例如：GlowSkin"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">产品卖点 *</label>
                <textarea value={sellingPoint} onChange={e => setSellingPoint(e.target.value)}
                  placeholder="例如：72小时持妆气垫粉底，轻薄透气不脱妆" rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">目标市场</label>
                <select value={targetCountry} onChange={e => setTargetCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="US">🇺🇸 美国</option>
                  <option value="EU">🇪🇺 欧洲</option>
                  <option value="JP">🇯🇵 日本</option>
                  <option value="CN">🇨🇳 中国</option>
                  <option value="UK">🇬🇧 英国</option>
                  <option value="CA">🇨🇦 加拿大</option>
                  <option value="AU">🇦🇺 澳洲</option>
                  <option value="SG">🇸🇬 新加坡</option>
                </select>
              </div>
              {!scrapeData && (
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">参考图（可选 / 自动提取DNA）</label>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  {referenceImage ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={referenceImage} alt="参考图" className="w-full h-32 object-cover" />
                      <button onClick={() => { setReferenceImage(null); setBrandDNA(null); setCutoutImage(null); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                        <X className="w-4 h-4 text-white" />
                      </button>
                      {isRemovingBg && (
                        <div className="absolute bottom-0 inset-x-0 px-3 py-2 flex items-center gap-2"
                          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                          <Scissors className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                          <span className="text-[11px] text-violet-300">AI抠图中...</span>
                        </div>
                      )}
                      {!isRemovingBg && cutoutImage && (
                        <div className="absolute bottom-0 inset-x-0 px-3 py-2 flex items-center gap-2"
                          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-[11px] text-green-300">抠图完成 · 产品1:1保真</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 rounded-xl flex flex-col items-center gap-2 transition-all hover:bg-white/[0.03]"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                      <ImagePlus className="w-6 h-6 text-white/20" />
                      <span className="text-xs text-white/30">点击上传图片</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => {
              if (!brandName.trim() || !sellingPoint.trim()) { setError('品牌名和卖点必填'); return; }
              setError(''); setFormStep(2);
            }}
              className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
              <span className="flex items-center justify-center gap-2">
                下一步：营销活动
              </span>
            </button>
          </div>
          )}

          {/* ── Step 2: 营销活动 ─────────────────────────────────── */}
          {formStep === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.03)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white/80">营销活动</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">活动主题 (可选)</label>
                <input type="text" value={campaignTheme} onChange={e => setCampaignTheme(e.target.value)}
                  placeholder="例如：周末八折促销 / 新品发布 / 母亲节献礼"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1"><Target className="w-3 h-3" />营销目标</label>
                  <select value={marketingGoal} onChange={e => setMarketingGoal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1"><Heart className="w-3 h-3" />情绪基调</label>
                  <select value={mood} onChange={e => setMood(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {moods.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" />紧迫感</label>
                  <select value={urgency} onChange={e => setUrgency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {urgencies.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1"><MousePointerClick className="w-3 h-3" />行动号召</label>
                  <input type="text" value={cta} onChange={e => setCta(e.target.value)}
                    placeholder="立即购买 / Shop Now"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setFormStep(1)}
                className="flex-1 py-4 rounded-xl text-sm font-bold text-white/60 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ← 上一步
              </button>
              <button onClick={() => { setError(''); setFormStep(3); }}
                className="flex-[2] py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                下一步：使用场景
              </button>
            </div>
          </div>
          )}

          {/* ── Step 3: 使用场景（多选） ──────────────────────────── */}
          {formStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-sm font-semibold text-white/80">使用场景</span>
                <span className="text-[11px] text-white/30">（可多选，AI推荐产品可能的使用场景）</span>
                {isRecommendingScenes && (
                  <span className="text-[11px] text-cyan-300/80 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    AI 正在为你的产品定制场景…
                  </span>
                )}
                {scenesRecommended && !isRecommendingScenes && (
                  <span className="text-[11px] text-emerald-300/80">✨ 已基于产品智能推荐</span>
                )}
                <button
                  type="button"
                  disabled={isRecommendingScenes || (!scrapeData?.title && !sellingPoint)}
                  onClick={() => recommendScenes({
                    title: scrapeData?.title,
                    description: scrapeData?.description,
                    brand: brandName || scrapeData?.brand,
                    sellingPoint,
                    keywords: scrapeData?.keywords,
                  })}
                  className="ml-auto text-[11px] px-2 py-1 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd' }}
                  title={(!scrapeData?.title && !sellingPoint) ? '先填写产品信息或解析链接' : '基于当前产品重新推荐'}
                >
                  ↻ 重新推荐
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {scenes.map((scene, i) => {
                  const isSelected = selectedScenes.includes(i);
                  return (
                    <button key={i} onClick={() => toggleScene(i)}
                      className="relative p-3 rounded-xl text-xs text-center transition-all"
                      style={{
                        background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                        color: isSelected ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)',
                      }}>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5"><Check className="w-3 h-3 text-violet-400" /></div>
                      )}
                      <div className="font-medium mb-0.5">{scene.label}</div>
                      <div className="text-[10px] opacity-50">{scene.platform} · {scene.aspectRatio}</div>
                    </button>
                  );
                })}
              </div>

              {/* 自定义场景描述 */}
              <div className="mt-3">
                <label className="block text-[11px] font-medium text-white/40 mb-1.5">
                  或描述你想要的场景（选填，覆盖上方预设场景描述）
                </label>
                <textarea
                  value={customScene}
                  onChange={e => setCustomScene(e.target.value)}
                  placeholder="例如：产品放在海边木桌上，阳光从窗户照进来，旁边放一杯咖啡和一本杂志"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-white/20 outline-none transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setFormStep(2)}
                className="flex-1 py-4 rounded-xl text-sm font-bold text-white/60 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ← 上一步
              </button>
              <button onClick={() => setFormStep(4)}
                className="flex-[2] py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                下一步：投放平台
              </button>
            </div>
          </div>
          )}

          {/* ── Step 4: 投放平台（多选） ──────────────────────────── */}
          {formStep === 4 && (
          <div className="space-y-6">
            <div className="rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-white/80">投放平台 / 媒体</span>
                <span className="text-[11px] text-white/30">（可多选）</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'IG Feed', label: 'IG Feed', desc: 'Instagram 方图 1:1' },
                  { key: 'IG Story', label: 'IG Story', desc: 'Instagram 竖版 9:16' },
                  { key: 'FB', label: 'Facebook 广告', desc: '横版 16:9' },
                  { key: 'TikTok', label: 'TikTok 广告', desc: '竖版 9:16' },
                  { key: 'TikTok Video', label: 'TikTok 视频', desc: '竖版 9:16' },
                  { key: 'Pinterest', label: 'Pinterest', desc: '竖版 2:3' },
                  { key: 'Google', label: 'Google Ads', desc: '横版 16:9' },
                  { key: 'YouTube', label: 'YouTube', desc: '横版 16:9' },
                ].map(p => {
                  const isSelected = selectedPlatforms.includes(p.key);
                  return (
                    <button key={p.key} onClick={() => togglePlatform(p.key)}
                      className="relative p-3 rounded-xl text-xs text-left transition-all"
                      style={{
                        background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                        color: isSelected ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)',
                      }}>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5"><Check className="w-3 h-3 text-violet-400" /></div>
                      )}
                      <div className="font-medium mb-0.5">{p.label}</div>
                      <div className="text-[10px] opacity-50">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setFormStep(3)}
                className="flex-1 py-4 rounded-xl text-sm font-bold text-white/60 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ← 上一步
              </button>
              <button onClick={generate}
                className="flex-[2] py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  生成 {selectedScenes.length * selectedPlatforms.length} 张素材
                </span>
              </button>
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── DNA 字段（可编辑） ────────────────────────────────────────────
function DNAField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] text-white/30 mb-1">{label}</p>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-xs text-white/80 outline-none"
        style={{ minWidth: 0 }} />
    </div>
  );
}

// ── 图片卡片（带再编辑 + 水印 + 下载扣点） ────────────────────────
function ImageCard({ img, index, brandName, onRefine }: {
  img: GeneratedImage; index: number; brandName: string;
  onRefine: (idx: number, instruction: string) => void;
}) {
  const [refineInput, setRefineInput] = useState('');
  const [showRefine, setShowRefine] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const QUICK = ['让产品更突出', '换个更亮的背景', '增加视觉冲击力', '更高级感'];

  const submitRefine = (text?: string) => {
    const cmd = (text ?? refineInput).trim();
    if (!cmd) return;
    onRefine(index, cmd);
    setRefineInput('');
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // 检查配额
      const checkRes = await fetch('/api/quota/check');
      const checkData = await checkRes.json();

      if (checkData.guest) {
        alert('请先登录后再下载素材');
        return;
      }
      if (!checkData.canGenerate) {
        alert(`配额不足（剩余 ${checkData.quotaRemaining} 次），请联系管理员充值`);
        return;
      }

      // 扣点
      const consumeRes = await fetch('/api/quota/consume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) });
      if (!consumeRes.ok) {
        const err = await consumeRes.json().catch(() => ({}));
        alert(err.error || '下载失败，请重试');
        return;
      }

      // 下载原图
      const a = document.createElement('a');
      a.href = img.url;
      a.download = `${brandName}_${img.scene}_${img.ratio}.png`;
      a.click();
    } catch {
      alert('下载出错，请重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="relative">
        <img src={img.url} alt={img.scene} className="w-full object-cover"
          style={{ aspectRatio: img.ratio.replace(':', '/') }} />
        {/* 水印 */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none"
          style={{ background: 'transparent' }}>
          <span className="text-white/10 text-4xl font-black tracking-widest -rotate-12">100x</span>
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[10px] font-medium text-white/70">{img.platform}</span>
        </div>
        <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          {img.ratio}
        </div>
        {img.refining && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-2" />
              <p className="text-xs text-white/70">正在再编辑...</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[11px] text-white/70">{img.scene}</p>
        </div>
      </div>

      {/* refine history 提示 */}
      {img.refineHistory && img.refineHistory.length > 0 && (
        <div className="px-3 py-1.5 text-[10px] text-white/40" style={{ background: 'rgba(139,92,246,0.05)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
          已编辑 {img.refineHistory.length} 次 · {img.refineHistory[img.refineHistory.length - 1].instruction.slice(0, 30)}
        </div>
      )}

      {/* 操作区 */}
      <div className="grid grid-cols-2 divide-x divide-white/5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleDownload} disabled={downloading}
          className="py-2.5 flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50">
          <Download className="w-3 h-3" />{downloading ? '下载中...' : '下载（扣1配额）'}
        </button>
        <button onClick={() => setShowRefine(s => !s)}
          className="py-2.5 flex items-center justify-center gap-1.5 text-xs text-violet-300 hover:text-violet-100 hover:bg-violet-500/10 transition-all">
          <Wand2 className="w-3 h-3" />{showRefine ? '收起' : '再编辑'}
        </button>
      </div>

      {/* refine 输入区 */}
      {showRefine && !img.refining && (
        <div className="p-3 space-y-2" style={{ background: 'rgba(139,92,246,0.04)', borderTop: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="flex flex-wrap gap-1">
            {QUICK.map(q => (
              <button key={q} onClick={() => submitRefine(q)}
                className="px-2 py-1 rounded-lg text-[10px] text-white/60 hover:text-white hover:bg-violet-500/20 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={refineInput} onChange={e => setRefineInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitRefine()}
              placeholder='例如："把产品放大""换金色背景""加阳光"'
              className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder:text-white/25 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={() => submitRefine()} disabled={!refineInput.trim()}
              className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-30 transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
