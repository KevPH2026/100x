'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Send, Sparkles, Globe, Edit3, Check, X, Image as ImageIcon,
  Loader2, Download, LayoutDashboard, LogOut, User, ChevronRight,
  ExternalLink, Palette, Target, Tag, Zap, PanelRightOpen, PanelRightClose, XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandProfile {
  brandName: string;
  website?: string;
  industry?: string;
  style?: string;
  keywords?: string[];
  colorPalette?: string[];
  targetAudience?: string;
  description?: string;
  sellingPoints?: string[];
  logoUrl?: string;
}

interface ChatMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  timestamp: number;
  suggestions?: string[];
  imageAttachment?: string; // base64 data URL or blob URL
}

interface GeneratedImage {
  url: string;
  platform: string;
  scene: string;
  ratio: string;
  loading?: boolean;
  error?: boolean;
}

// ─── Editable Field Component ─────────────────────────────────────────────────

function EditableField({
  label, value, icon: Icon, onSave, placeholder,
}: {
  label: string; value: string; icon: any; onSave: (v: string) => void; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span className="text-xs text-zinc-500 shrink-0">{label}</span>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { onSave(draft); setEditing(false); } if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 outline-none focus:border-violet-500 min-w-0"
          autoFocus
        />
        <button onClick={() => { onSave(draft); setEditing(false); }} className="text-emerald-400 hover:text-emerald-300 shrink-0"><Check className="w-3 h-3" /></button>
        <button onClick={() => { setDraft(value); setEditing(false); }} className="text-zinc-500 hover:text-zinc-400 shrink-0"><X className="w-3 h-3" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setEditing(true)}>
      <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <span className="text-xs text-zinc-200 truncate">{value || placeholder || '—'}</span>
      <Edit3 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}

// ─── Brand Panel ──────────────────────────────────────────────────────────────

function BrandPanel({
  brand, onUpdate, onConfirm, confirmed,
}: {
  brand: BrandProfile | null;
  onUpdate: (b: BrandProfile) => void;
  onConfirm: () => void;
  confirmed: boolean;
}) {
  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
          <Globe className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">告诉我你的品牌网站</p>
        <p className="text-xs text-zinc-600 mt-1">我会自动分析并提炼品牌档案</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-zinc-100 truncate">{brand.brandName}</h3>
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 mt-0.5 truncate">
              {brand.website.replace(/^https?:\/\//, '')}
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          )}
        </div>
        {brand.logoUrl && (
          <img src={brand.logoUrl} alt="" className="w-10 h-10 rounded-lg border border-zinc-700 object-cover shrink-0 ml-2" />
        )}
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Editable Fields */}
      <div className="space-y-2.5">
        <EditableField
          label="行业" value={brand.industry || ''} icon={Target}
          onSave={v => onUpdate({ ...brand, industry: v })} placeholder="点击设置"
        />
        <EditableField
          label="风格" value={brand.style || ''} icon={Palette}
          onSave={v => onUpdate({ ...brand, style: v })} placeholder="点击设置"
        />
        <EditableField
          label="人群" value={brand.targetAudience || ''} icon={User}
          onSave={v => onUpdate({ ...brand, targetAudience: v })} placeholder="点击设置"
        />
      </div>

      {/* Keywords */}
      {brand.keywords && brand.keywords.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Tag className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">关键词</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {brand.keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {brand.description && (
        <div>
          <div className="text-xs text-zinc-500 mb-1">品牌描述</div>
          <p className="text-xs text-zinc-400 leading-relaxed">{brand.description.slice(0, 200)}</p>
        </div>
      )}

      {/* Confirm Button */}
      {!confirmed && (
        <button
          onClick={onConfirm}
          className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          确认并保存
        </button>
      )}

      {confirmed && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 py-1">
          <Check className="w-3.5 h-3.5" />
          品牌档案已保存
        </div>
      )}
    </div>
  );
}

// ─── Image Grid ───────────────────────────────────────────────────────────────

function ImageGrid({ images, onDownload }: { images: GeneratedImage[]; onDownload: (img: GeneratedImage) => void }) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-300">生成的素材</h4>
        <span className="text-xs text-zinc-500">{images.filter(i => !i.loading && !i.error).length}/{images.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
            {img.loading ? (
              <div className="aspect-square flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : img.error ? (
              <div className="aspect-square flex items-center justify-center">
                <div className="text-center px-2">
                  <X className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-xs text-zinc-500">生成失败</p>
                </div>
              </div>
            ) : (
              <>
                <img src={img.url} alt={img.scene} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 max-md:active:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <span className="text-xs text-white/80">{img.platform}</span>
                  <button
                    onClick={() => onDownload(img)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-md text-xs text-white transition-colors"
                  >
                    <Download className="w-3 h-3" /> 下载
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [brandConfirmed, setBrandConfirmed] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rightTab, setRightTab] = useState<'brand' | 'images'>('brand');
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null); // base64 data URL
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load existing brand when logged in
  useEffect(() => {
    if (session?.user && !brand) {
      fetch('/api/user/brand').then(r => r.ok ? r.json() : null).then(data => {
        if (data?.brands?.length > 0) {
          const b = data.brands[0];
          setBrand({
            brandName: b.brandName,
            industry: b.industry || undefined,
            style: b.style || undefined,
            targetAudience: b.targetAudience || undefined,
            description: b.notes || undefined,
            logoUrl: b.logoUrl || undefined,
          });
          setBrandConfirmed(true);
        }
      }).catch(() => {});
    }
  }, [session?.user]);

  // Load recent assets count
  useEffect(() => {
    if (session?.user) {
      fetch('/api/quota/check').then(r => r.json()).then(data => {
        // just trigger session awareness
      }).catch(() => {});
    }
  }, [session?.user]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([{
          id: 'init',
          role: 'agent',
          content: session?.user
            ? `你好！我是 **100x AI素材助手** 🎨\n\n告诉我你的**品牌网站**，我来帮你快速建立品牌档案，然后一键生成广告素材。\n\n直接发网址就行，比如 \`glowskin.com\``
            : '你好！我是 **100x AI素材助手** 🎨\n\n先登录，然后告诉我你的品牌网站，我来帮你快速生成广告素材。',
          timestamp: Date.now(),
          suggestions: session?.user
            ? ['分析我的品牌网站', '直接告诉我品牌名和卖点']
            : [],
        }]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [session?.user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() && !pendingImage) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim() || '(上传了参考图)',
      timestamp: Date.now(),
      imageAttachment: pendingImage || undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const attachedImage = pendingImage;
    setPendingImage(null);
    setSending(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim() || '(上传了参考图)',
          brandProfile: brand,
          conversationState: { brandConfirmed },
          referenceImage: attachedImage || undefined,
        }),
      });

      const data = await res.json();

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'agent',
        content: data.reply || '抱歉，我无法理解。请再试一次。',
        timestamp: Date.now(),
        suggestions: data.suggestions,
      };
      setMessages(prev => [...prev, agentMsg]);

      // Update brand profile
      if (data.brandProfile) {
        setBrand(prev => ({ ...prev, ...data.brandProfile }));
        setBrandConfirmed(false);
        setRightTab('brand');
        // On mobile, auto-open panel when brand is detected
        if (window.innerWidth < 768) setPanelOpen(true);
      }

      // Handle generate action
      if (data.action === 'generate' && data.generateParams) {
        await handleGenerate(data.generateParams);
      }

      // Handle brand save
      if (data.action === 'brand_saved') {
        setBrandConfirmed(true);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'system',
        content: '⚠️ 网络错误，请重试',
        timestamp: Date.now(),
      }]);
    } finally {
      setSending(false);
    }
  }, [brand, brandConfirmed, sending, pendingImage]);

  const handleGenerate = useCallback(async (params: {
    brandName: string;
    sellingPoint: string;
    scenes: { label: string; desc: string; aspectRatio: string; platform?: string }[];
    referenceImage?: string;
    targetCountry?: string;
    mood?: string;
  }) => {
    setGenerating(true);
    setRightTab('images');
    if (window.innerWidth < 768) setPanelOpen(true);

    // 再编辑时：优先用上一版生成的图片做参考（保持产品一致性）
    const lastGeneratedUrl = images.find(i => i.url && !i.error)?.url;
    const refImage = lastGeneratedUrl || params.referenceImage;

    const newImages: GeneratedImage[] = params.scenes.map(s => ({
      url: '', platform: s.platform || s.label, scene: s.label, ratio: s.aspectRatio, loading: true,
    }));
    setImages(newImages);

    // Generate one by one
    for (let i = 0; i < params.scenes.length; i++) {
      const scene = params.scenes[i];
      try {
        const res = await fetch('/api/adforge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: params.brandName,
            sellingPoint: params.sellingPoint,
            sceneIndex: 0,
            customSceneDesc: scene.desc,
            referenceImage: refImage,
            isReEdit: !!lastGeneratedUrl,
            targetCountry: params.targetCountry || 'US',
            mood: params.mood || 'modern and clean',
            forceRatio: scene.aspectRatio,
            forcePlatform: scene.platform,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        setImages(prev => prev.map((img, idx) =>
          idx === i
            ? { ...img, loading: false, url: data.image?.url || '', platform: data.image?.platform || scene.label, error: !data.image?.url }
            : img
        ));
      } catch (e) {
        setImages(prev => prev.map((img, idx) =>
          idx === i ? { ...img, loading: false, error: true } : img
        ));
      }
    }

    setGenerating(false);

    setMessages(prev => [...prev, {
      id: `gen-${Date.now()}`,
      role: 'agent',
      content: `✅ 全部完成！右侧可以预览和下载素材。还想调整或继续生成其他平台的？`,
      timestamp: Date.now(),
      suggestions: ['再来几张其他平台的', '调整品牌档案重新生成'],
    }]);
  }, [images]);

  const handleDownload = useCallback(async (img: GeneratedImage) => {
    if (!session?.user) {
      setMessages(prev => [...prev, {
        id: `dl-${Date.now()}`, role: 'system',
        content: '⚠️ 请先登录再下载', timestamp: Date.now(),
      }]);
      return;
    }

    try {
      const checkRes = await fetch('/api/quota/check');
      const checkData = await checkRes.json();
      if (checkData.remaining <= 0) {
        setMessages(prev => [...prev, {
          id: `quota-${Date.now()}`, role: 'system',
          content: '⚠️ 下载额度已用完', timestamp: Date.now(),
        }]);
        return;
      }

      const consumeRes = await fetch('/api/quota/consume', { method: 'POST' });
      if (consumeRes.ok) window.open(img.url, '_blank');
    } catch {
      window.open(img.url, '_blank');
    }
  }, [session?.user]);

  const handleSuggestion = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'system',
        content: '⚠️ 图片不能超过10MB', timestamp: Date.now(),
      }]);
      return;
    }
    // Compress if needed (>1MB): resize to max 1024px
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        if (file.size <= 1024 * 1024 || img.width <= 1024) {
          // No resize needed
          setPendingImage(ev.target?.result as string);
        } else {
          // Resize to max 1024px on longest side
          const maxDim = 1024;
          const scale = maxDim / Math.max(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setPendingImage(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const removePendingImage = useCallback(() => {
    setPendingImage(null);
  }, []);

  // Badge count for panel toggle
  const badgeCount = (brand ? 1 : 0) + images.filter(i => !i.loading && !i.error).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top Bar */}
      <header className="shrink-0 h-12 border-b border-zinc-800 flex items-center justify-between px-3 md:px-4">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">x</div>
            <span className="text-sm font-semibold text-zinc-200">100x</span>
          </a>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {session?.user && (
            <>
              <a href="/dashboard" className="hidden md:flex text-xs text-zinc-500 hover:text-zinc-300 transition-colors items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />素材库
              </a>
            </>
          )}
          {session?.user ? (
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <a href="/login" className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
              <User className="w-3.5 h-3.5" />登录
            </a>
          )}
          {/* Panel toggle (mobile: always visible, desktop: hidden when panel is open) */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="relative text-zinc-500 hover:text-zinc-300 transition-colors md:hidden"
          >
            <PanelRightOpen className="w-5 h-5" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-[10px] flex items-center justify-center text-white">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 md:px-4 py-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    {msg.role === 'agent' && (
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white'
                        : msg.role === 'system'
                          ? 'bg-transparent text-zinc-500 text-xs'
                          : 'bg-zinc-800 text-zinc-200'
                    }`}>
                      {/* Image attachment */}
                      {msg.imageAttachment && (
                        <img
                          src={msg.imageAttachment}
                          alt="参考图"
                          className="rounded-lg max-h-40 mb-2 object-cover"
                        />
                      )}
                      {/* Simple markdown: bold + code + newlines */}
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                          {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**'))
                              return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                            if (part.startsWith('`') && part.endsWith('`'))
                              return <code key={j} className="bg-zinc-700/50 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
                            return <span key={j}>{part}</span>;
                          })}
                        </p>
                      ))}
                    </div>
                  </div>
                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestion(s)}
                          disabled={sending}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 active:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {s} <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Sending indicator */}
            {sending && (
              <div className="flex items-center gap-2 ml-9">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-xs text-zinc-500">思考中...</span>
              </div>
            )}

            {/* Generating indicator */}
            {generating && (
              <div className="flex items-center gap-2 ml-9">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-xs text-zinc-500">
                  生成中 ({images.filter(i => !i.loading).length}/{images.length})...
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-zinc-800 p-3 md:p-4 pb-[env(safe-area-inset-bottom,0px)] md:pb-4">
            {/* Pending image preview */}
            {pendingImage && (
              <div className="max-w-3xl mx-auto mb-2">
                <div className="relative inline-block">
                  <img src={pendingImage} alt="待发送" className="h-16 rounded-lg object-cover border border-zinc-700" />
                  <button
                    onClick={removePendingImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || generating}
                className="shrink-0 w-10 h-10 rounded-xl border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 disabled:opacity-50 flex items-center justify-center transition-colors"
                title="上传参考图"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="输入品牌网站、需求、或指令..."
                disabled={sending || generating}
                rows={1}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 md:px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 resize-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={(!input.trim() && !pendingImage) || sending || generating}
                className="shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Brand Panel + Images — Desktop */}
        <div className="hidden md:flex w-[340px] shrink-0 border-l border-zinc-800 flex-col">
          {/* Tab Switcher */}
          <div className="shrink-0 flex border-b border-zinc-800">
            <button
              onClick={() => setRightTab('brand')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${rightTab === 'brand' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              品牌档案
            </button>
            <button
              onClick={() => setRightTab('images')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${rightTab === 'images' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              生成结果
              {images.length > 0 && (
                <span className="absolute -top-0.5 right-4 w-4 h-4 rounded-full bg-violet-600 text-[10px] flex items-center justify-center">
                  {images.filter(i => !i.loading && !i.error).length}
                </span>
              )}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'brand' ? (
              <BrandPanel
                brand={brand}
                onUpdate={setBrand}
                onConfirm={() => sendMessage('确认')}
                confirmed={brandConfirmed}
              />
            ) : (
              <ImageGrid images={images} onDownload={handleDownload} />
            )}
          </div>
        </div>

        {/* Right: Brand Panel + Images — Mobile Overlay */}
        {panelOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setPanelOpen(false)}
            />
            {/* Slide-up Panel */}
            <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl flex flex-col"
              style={{ height: '75dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              {/* Handle bar */}
              <div className="flex justify-center pt-2 pb-1" onClick={() => setPanelOpen(false)}>
                <div className="w-10 h-1 rounded-full bg-zinc-700" />
              </div>
              {/* Tab Switcher */}
              <div className="shrink-0 flex border-b border-zinc-800">
                <button
                  onClick={() => setRightTab('brand')}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${rightTab === 'brand' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-500'}`}
                >
                  品牌档案
                </button>
                <button
                  onClick={() => setRightTab('images')}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${rightTab === 'images' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-500'}`}
                >
                  生成结果
                  {images.length > 0 && (
                    <span className="absolute -top-0.5 right-4 w-4 h-4 rounded-full bg-violet-600 text-[10px] flex items-center justify-center">
                      {images.filter(i => !i.loading && !i.error).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="px-3 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {rightTab === 'brand' ? (
                  <BrandPanel
                    brand={brand}
                    onUpdate={setBrand}
                    onConfirm={() => { sendMessage('确认'); setPanelOpen(false); }}
                    confirmed={brandConfirmed}
                  />
                ) : (
                  <ImageGrid images={images} onDownload={handleDownload} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
