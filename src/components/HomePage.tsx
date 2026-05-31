"use client";

import { useState, useEffect, useRef } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { Step1Materials } from "@/components/Step1_Materials";
import { Step2Scene } from "@/components/Step2_Scene";
import { Step3Style } from "@/components/Step3_Style";
import { Step4Audience } from "@/components/Step4_Audience";
import { Step5Generating } from "@/components/Step5_Generating";
import { SettingsModal } from "@/components/SettingsModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Download,
  Layers,
  Star,
  Rocket,
  Shield,
  Clock,
  Settings,
  Brain,
  Wand2,
  Image,
  PenLine,
  ChevronLeft,
  ChevronRight,
  MousePointer,
  BarChart2,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { IdeaLabLogo } from "@/components/Logo";

const WORKFLOW = [
  { step: "01", label: "上传素材" },
  { step: "02", label: "选场景" },
  { step: "03", label: "配风格" },
  { step: "04", label: "AI 生成" },
];

const PAIN_POINTS = [
  { emoji: "😫", title: "有素材，不会用", desc: "截图、文档、产品图堆满文件夹，不知道怎么变成能发的内容" },
  { emoji: "🌀", title: "设计师排期要3天", desc: "等设计图比等客户回复还久，节奏全被打乱" },
  { emoji: "📝", title: "文案改8遍还是不对", desc: "自己写没感觉，找人写又说不清需求，来回拉扯" },
];

// ─── Real Product Cases ──────────────────────────────────────────────────────
const PRODUCT_CASES = [
  {
    id: "headphone",
    emoji: "🎧",
    name: "无线降噪耳机",
    brand: "某科技品牌",
    desc: "极简设计 · 32小时续航 · 深度降噪",
    copy: "听过很多降噪耳机，直到戴上它——安静到能听见自己的呼吸。通勤党和出差人闭眼入。",
    platform: "小红书",
    tags: "#无线耳机 #降噪耳机 #数码好物",
    color: "from-violet-600 to-indigo-600",
    bg: "bg-violet-600/10",
    border: "border-violet-500/30",
    accent: "text-violet-400",
  },
  {
    id: "coffee",
    emoji: "☕",
    name: "精品挂耳咖啡",
    brand: "某咖啡工作室",
    desc: "云南豆 · 手冲级风味 · 4种烘焙",
    copy: "早起的仪式感，是手冲一包挂耳给的。云南精品豆，4种烘焙可选，比咖啡店现冲还好喝。",
    platform: "朋友圈",
    tags: "",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-600/10",
    border: "border-amber-500/30",
    accent: "text-amber-400",
  },
  {
    id: "skincare",
    emoji: "🧴",
    name: "VC精华液",
    brand: "某护肤品牌",
    desc: "15%原型VC · 抗氧提亮 · 早晚可用",
    copy: "用了3个月，原相机怼脸拍也不怕。15%原型VC不是盖的，暗沉黄气真的在退。",
    platform: "小红书",
    tags: "#VC精华 #早C晚A #护肤分享",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-600/10",
    border: "border-rose-500/30",
    accent: "text-rose-400",
  },
  {
    id: "shoes",
    emoji: "👟",
    name: "碳板跑鞋",
    brand: "某运动品牌",
    desc: "碳纤维推进板 · 42km续航 · 竞速之选",
    copy: "每公里配速快了23秒。碳板推进板加持，长距离后半程依然有力，竞速党闭眼入。",
    platform: "微博",
    tags: "#碳板跑鞋 #跑步装备 #马拉松训练",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-600/10",
    border: "border-cyan-500/30",
    accent: "text-cyan-400",
  },
  {
    id: "watch",
    emoji: "⌚",
    name: "智能运动手表",
    brand: "某科技品牌",
    desc: "双频GPS · 14天续航 · 防水50米",
    copy: "跑了30公里掉电12%，GPS定位精度到米级。登山、游泳、越野，一块表全搞定。",
    platform: "抖音",
    tags: "#智能手表 #运动装备 #跑步",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-600/10",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
  },
  {
    id: "bag",
    emoji: "🎒",
    name: "极简双肩包",
    brand: "某生活方式品牌",
    desc: "磁吸开合 · 16L容量 · 防泼水",
    copy: "背上它，地铁里被人问了三次链接。磁吸开合超顺滑，16L装得下15寸电脑+换洗衣物。",
    platform: "小红书",
    tags: "#双肩包 #极简生活 #通勤包",
    color: "from-slate-400 to-zinc-600",
    bg: "bg-slate-600/10",
    border: "border-slate-500/30",
    accent: "text-slate-400",
  },
];

// ─── Demo Guide ─────────────────────────────────────────────────────────────
const DEMO_GUIDE_STEPS = [
  {
    step: "01",
    title: "丢素材进来",
    desc: "产品图、链接、文字描述、截图，什么都行。AI 会自己理解。",
    icon: <MousePointer className="w-5 h-5" />,
  },
  {
    step: "02",
    title: "AI 自动分析",
    desc: "识别风格、受众、场景，提取产品核心卖点。",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    step: "03",
    title: "生成多条文案",
    desc: "不同平台、不同角度，按需挑选直接用。",
    icon: <PenLine className="w-5 h-5" />,
  },
  {
    step: "04",
    title: "说「换一版」继续调",
    desc: "不满意就继续说，AI 重新生成，不花次数直到满意为止。",
    icon: <RefreshCw className="w-5 h-5" />,
  },
];

const FEATURES = [
  { icon: <Layers className="w-5 h-5" />, title: "素材即输入", desc: "文件、链接、文字、截图，随便什么格式，丢进去就行" },
  { icon: <Brain className="w-5 h-5" />, title: "AI 全自动", desc: "自动提炼卖点，生成多条不同角度的营销文案" },
  { icon: <Image className="w-5 h-5" />, title: "一键出图", desc: "根据文案和风格，AI生成可下载的设计稿" },
  { icon: <Download className="w-5 h-5" />, title: "直接可用", desc: "PNG 高清输出，可直接用于朋友圈、社媒、电商" },
];

const USE_CASES = [
  { title: "朋友圈素材", desc: "打造高转化朋友圈图文", icon: "🖼" },
  { title: "社媒内容", desc: "小红书/抖音/微博多平台适配", icon: "📱" },
  { title: "电商主图", desc: "淘宝/京东/亚马逊主图文案", icon: "🛒" },
  { title: "品牌故事", desc: "从产品到叙事的完整内容", icon: "📖" },
  { title: "独立站文案", desc: "产品页、落地页、About Us", icon: "🌐" },
  { title: "广告素材", desc: "Google/Meta/TikTok 广告文案", icon: "🎯" },
];

const CHANGELOG = [
  { version: "v0.2.0", date: "2026-04-20", tags: ["新功能", "重大更新"], changes: [
    "全新深色炫酷首页上线",
    "增加灯泡 Logo SVG",
    "5步向导流程完整跑通",
    "支持素材上传/链接/文本三种方式",
    "支持朋友圈、小红书、电商等6大场景",
    "支持受众+目标精准生成",
    "后端3模型Pipeline上线（qwen-vl + GPT-4o + MiniMax）",
  ]},
  { version: "v0.1.0", date: "2026-04-19", tags: ["初始版本"], changes: [
    "项目初始化，基础框架搭建",
    "shadcn/ui + Tailwind + Zustand 集成",
    "API Route 生成接口搭建",
  ]},
];

function ChangelogTag({ tags }: { tags: string[] }) {
  return (
    <div className="flex gap-1.5">
      {tags.map(t => (
        <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          t === "新功能" ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" :
          t === "重大更新" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
          "bg-white/10 text-white/50 border border-white/10"
        }`}>{t}</span>
      ))}
    </div>
  );
}

// ─── Case Card Component ────────────────────────────────────────────────────
function CaseCard({ c, selected, onClick }: { c: typeof PRODUCT_CASES[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-52 rounded-2xl border transition-all duration-300 text-left ${
        selected
          ? `${c.bg} ${c.border} shadow-lg`
          : "bg-white/[0.03] border-white/8 hover:bg-white/[0.06] hover:border-white/20"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-xl shadow-lg`}>
            {c.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{c.name}</p>
            <p className="text-xs text-white/30 truncate">{c.brand}</p>
          </div>
        </div>
        <p className="text-xs text-white/40 mb-3 line-clamp-2">{c.desc}</p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selected ? c.bg : "bg-white/10"} ${c.accent}`}>
            {c.platform}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── HomeContent (Dark Landing Page) ─────────────────────────────────────────
function HomeContent({ onStart, onSettings }: { onStart: () => void; onSettings: () => void }) {
  const [selectedCase, setSelectedCase] = useState(PRODUCT_CASES[0]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const amount = 220;
    carouselRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#070711] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#070711]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IdeaLabLogo size={36} />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              IdeaLab
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSettings} className="text-white/50 hover:text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("pain")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              痛点
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("cases")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              案例
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              功能
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("changelog")?.scrollIntoView({ behavior: "smooth" })} className="text-white/50 hover:text-white hover:bg-white/10 hidden md:block">
              更新
            </Button>
            <Button
              size="sm"
              onClick={onStart}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/50 ml-2"
            >
              免费试用
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 px-6 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-700/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-700/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-violet-300 mb-8 backdrop-blur-sm">
            <Wand2 className="w-4 h-4 text-violet-400" />
            <span>AI 驱动的新一代内容创作平台</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            丢素材，<span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">5分钟</span>
            <br />
            出营销内容和设计稿
          </h1>

          <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            截图、文档、产品图、竞品链接 — 随便什么素材，丢进去，AI 自动分析、生成可发布的文案和设计稿。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-900/60 text-white text-lg font-semibold rounded-2xl border border-violet-500/30"
              onClick={onStart}
            >
              立即开始 <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 border border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-lg font-semibold rounded-2xl backdrop-blur-sm"
              onClick={() => document.getElementById("cases")?.scrollIntoView({ behavior: "smooth" })}
            >
              看实际案例
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-white/30">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-white/60">4.9</span>
              <span>用户评分</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Rocket className="w-4 h-4 text-violet-400" />
              <span className="font-medium text-white/60">5分钟</span>
              <span>平均出稿</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white/60">100%</span>
              <span>内容原创</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 用户共鸣 ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#070711] to-[#0d0d1a]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">你一定听过这些话</p>
          <h2 className="text-3xl font-bold text-white mb-12">做内容这件事，是不是总卡在这？</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { quote: "我要五彩斑斓的黑", sub: "—— 甲方爸爸的经典名言" },
              { quote: "总之，你懂我意思吧？", sub: "—— 说完自己也忘了什么意思" },
              { quote: "不对，再改改", sub: "—— 第三版往往不如第一版" },
            ].map((q, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
                <div className="text-2xl font-bold text-white mb-3 italic">"{q.quote}"</div>
                <div className="text-sm text-white/30">{q.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-lg">IdeaLab 让 AI 替你理解、替你创作、替你执行</p>
        </div>
      </section>

      {/* ── Pain Points ─────────────────────────────────────────────────── */}
      <section id="pain" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">你的痛点</p>
            <h2 className="text-4xl font-bold text-white mb-4">做内容这件事，累在哪？</h2>
            <p className="text-lg text-white/40">IdeaLab 解决这些问题</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p) => (
              <Card
                key={p.title}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="text-4xl mb-5">{p.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
                <p className="text-white/40 leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">
            工作流
          </p>
          <h2 className="text-center text-3xl font-bold text-white mb-14">简单4步，告别内容焦虑</h2>

          <div className="flex items-start justify-between gap-4 relative">
            <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-600/50 via-indigo-500/50 to-violet-600/50" />
            {WORKFLOW.map((w) => (
              <div key={w.step} className="flex-1 flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40 text-white font-bold text-sm border border-violet-500/30">
                  {w.step}
                </div>
                <span className="text-sm font-medium text-white/60">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo Guide ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">怎么用</p>
            <h2 className="text-4xl font-bold text-white mb-4">对话式生成，想怎么改就怎么改</h2>
            <p className="text-lg text-white/40">像和设计师沟通一样，说人话就行</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DEMO_GUIDE_STEPS.map((s, i) => (
              <div key={s.step} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
                  {s.icon}
                </div>
                <div className="text-xs text-violet-400 font-bold mb-2">{s.step}</div>
                <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Cases ─────────────────────────────────────────────────── */}
      <section id="cases" className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">真实案例</p>
              <h2 className="text-4xl font-bold text-white">点击任意案例，查看生成效果</h2>
            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollCarousel("left")}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal carousel */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {PRODUCT_CASES.map((c) => (
              <CaseCard
                key={c.id}
                c={c}
                selected={selectedCase.id === c.id}
                onClick={() => setSelectedCase(c)}
              />
            ))}
          </div>

          {/* Selected case preview */}
          <div className={`mt-6 rounded-2xl border ${selectedCase.border} ${selectedCase.bg} p-6 transition-all`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedCase.color} flex items-center justify-center text-2xl shadow-lg`}>
                {selectedCase.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedCase.bg} ${selectedCase.accent}`}>
                    {selectedCase.platform}
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedCase.name}</h3>
                </div>
                <p className="text-sm text-white/40">{selectedCase.desc}</p>
              </div>
            </div>
            <blockquote className="text-base text-white/80 leading-relaxed italic border-l-2 border-white/20 pl-4">
              "{selectedCase.copy}"
            </blockquote>
            {selectedCase.tags && (
              <p className={`text-sm mt-3 ${selectedCase.accent} opacity-70`}>{selectedCase.tags}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">核心能力</p>
            <h2 className="text-4xl font-bold text-white mb-4">省去 90% 的沟通成本</h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto">不需要设计师，不需要文案，你只需要告诉 AI 你要什么</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-violet-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 flex items-center justify-center mb-5 border border-violet-500/20">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/40 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ───────────────────────────────────────────────────── */}
      <section id="usecases" className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">适用场景</p>
            <h2 className="text-4xl font-bold text-white mb-4">覆盖所有营销内容需求</h2>
            <p className="text-lg text-white/40">一个平台，解决所有内容创作场景</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {USE_CASES.map((c) => (
              <div
                key={c.title}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-violet-500/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="font-bold text-white mb-1">{c.title}</h3>
                <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            准备好告别内容焦虑了吗？
          </h2>
          <p className="text-xl text-white/40 mb-10">
            注册后获得 5 次免费生成额度，说"好"之前不限次数调整
          </p>
          <Button
            size="lg"
            className="h-14 px-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-900/60 text-white text-lg font-semibold rounded-2xl border border-violet-500/30"
            onClick={onStart}
          >
            立即开始创作 <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-white/20 mt-6">无需信用卡 · 5分钟上手 · 随时可停</p>
        </div>
      </section>

      {/* ── Changelog ───────────────────────────────────────────────────── */}
      <section id="changelog" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">更新日志</p>
          <h2 className="text-2xl font-bold text-white mb-8">产品迭代记录</h2>

          <div className="space-y-8">
            {CHANGELOG.map((cl) => (
              <div key={cl.version} className="border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-bold text-white">{cl.version}</span>
                  <span className="text-sm text-white/30">{cl.date}</span>
                  <ChangelogTag tags={cl.tags} />
                </div>
                <ul className="space-y-2">
                  {cl.changes.map((change) => (
                    <li key={change} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="text-violet-400 mt-0.5">·</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <IdeaLabLogo size={24} />
            <span className="text-sm text-white/30">© 2026 IdeaLab. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <span>Made with ❤️ by WithHuman.ai</span>
          </div>
        </div>
      </footer>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [showWizard, setShowWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [step, setStep] = useState(1);
  const [wizardKey, setWizardKey] = useState(0);
  const { reset } = useWizardStore();

  const handleStart = () => {
    reset();
    setWizardKey(k => k + 1);
    setStep(1);
    setShowWizard(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClose = () => {
    setShowWizard(false);
    setStep(1);
    reset();
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));
  const handleSettingsClose = () => setShowSettings(false);

  return (
    <div className="min-h-screen bg-[#070711]">
      {!showWizard ? (
        <HomeContent onStart={handleStart} onSettings={() => setShowSettings(true)} />
      ) : (
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 bg-[#070711]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IdeaLabLogo size={32} />
                <span className="font-bold text-lg bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  IdeaLab
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-white/50 hover:text-white">
                关闭
              </Button>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center px-6 py-10">
            <div className="w-full max-w-3xl">
              <StepIndicator />

              <div className="mt-8">
                {step === 1 && <Step1Materials />}
                {step === 2 && <Step2Scene />}
                {step === 3 && <Step3Style />}
                {step === 4 && <Step4Audience />}
                {step === 5 && <Step5Generating />}
              </div>

              {step < 4 && (
                <div className="flex gap-3 mt-8">
                  {step > 1 && (
                    <Button variant="outline" onClick={handleBack} className="flex-1 h-12 border-white/20 text-white/70 hover:text-white rounded-xl">
                      上一步
                    </Button>
                  )}
                  <Button onClick={handleNext} className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-900/30">
                    下一步
                  </Button>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {showSettings && <SettingsModal onClose={handleSettingsClose} />}
    </div>
  );
}
