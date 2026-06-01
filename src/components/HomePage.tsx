"use client";

import { useState } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { Step1Materials } from "@/components/Step1_Materials";
import { Step2Scene } from "@/components/Step2_Scene";
import { Step3Style } from "@/components/Step3_Style";
import { Step4Audience } from "@/components/Step4_Audience";
import { Step5Generating } from "@/components/Step5_Generating";
import { SettingsModal } from "@/components/SettingsModal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Settings, X } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { Logo100x } from "@/components/Logo";

// ─── HomeContent (Landing Page) ──────────────────────────────────────────────
function HomeContent({ onStart, onSettings }: { onStart: () => void; onSettings: () => void }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] antialiased">
      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-[#E5E5E5]">
        <div className="max-w-[1080px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo100x size={22} />
            <span className="font-semibold text-[15px] tracking-tight">100x</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#how" className="text-[13px] text-[#888] hover:text-[#111] transition-colors hidden sm:block">
              原理
            </a>
            <a href="#platforms" className="text-[13px] text-[#888] hover:text-[#111] transition-colors hidden sm:block">
              平台
            </a>
            <button
              onClick={onSettings}
              className="p-1.5 text-[#999] hover:text-[#111] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onStart}
              className="text-[13px] font-medium bg-[#111] text-white h-8 px-4 rounded-md hover:bg-[#333] transition-colors"
            >
              开始
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6">
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-[40px] md:text-[56px] font-bold tracking-[-0.03em] leading-[1.1] text-[#111] mb-5">
            广告素材，<br />100倍出图速度
          </h1>
          <p className="text-[17px] md:text-[19px] text-[#666] leading-[1.6] mb-8 max-w-[480px]">
            上传产品信息，AI 生成多平台广告素材。<br className="hidden md:block" />
            不注册，直接用。
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onStart}
              className="text-[15px] font-medium bg-[#111] text-white h-11 px-7 rounded-lg hover:bg-[#333] transition-colors inline-flex items-center gap-2"
            >
              免费开始 <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[13px] text-[#999]">无需注册</span>
          </div>
        </div>
      </section>

      {/* ── Preview ────────────────────────────────────────────────────────── */}
      <section className="pb-20 md:pb-28 px-6">
        <div className="max-w-[1080px] mx-auto">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Browser bar */}
            <div className="flex items-center gap-1.5 px-4 h-10 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]" />
              <div className="flex-1 ml-3 h-6 rounded-md bg-[#F0F0F0] flex items-center px-3">
                <span className="text-[11px] text-[#999] font-mono">100x.pics</span>
              </div>
            </div>
            {/* Content grid */}
            <div className="p-5 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { color: '#F5F0EB', accent: '#D4A574' },
                  { color: '#EBF0F5', accent: '#7498C4' },
                  { color: '#F0F5EB', accent: '#8BB464' },
                  { color: '#F5EBF0', accent: '#B4648B' },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: c.color }}
                  >
                    <div
                      className="w-14 h-14 rounded-lg"
                      style={{ backgroundColor: c.accent, opacity: 0.3 }}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-[#F5F5F5] hidden md:block" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 md:py-28 px-6 border-t border-[#E5E5E5]">
        <div className="max-w-[1080px] mx-auto">
          <h2 className="text-[28px] md:text-[36px] font-bold tracking-[-0.02em] mb-16">
            三步出素材
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                num: '1',
                title: '上传素材',
                desc: '产品图片、文字描述、竞品链接 — 任何形式都可以。',
              },
              {
                num: '2',
                title: 'AI 生成',
                desc: '选择平台和风格，AI 自动生成广告图片和文案。',
              },
              {
                num: '3',
                title: '下载投放',
                desc: '高清素材直接下载，尺寸匹配各平台，即刻上线。',
              },
            ].map((s) => (
              <div key={s.num}>
                <div className="text-[13px] font-mono text-[#999] mb-3">{s.num}</div>
                <h3 className="text-[18px] font-semibold text-[#111] mb-2">{s.title}</h3>
                <p className="text-[15px] text-[#666] leading-[1.6]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platforms ─────────────────────────────────────────────────────── */}
      <section id="platforms" className="py-16 px-6 border-t border-[#E5E5E5]">
        <div className="max-w-[1080px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[13px] text-[#999] tracking-wide uppercase">支持平台</p>
          <p className="text-[15px] text-[#555] font-medium tracking-wide">
            Instagram · TikTok · Facebook · 小红书 · Pinterest · YouTube
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 border-t border-[#E5E5E5]">
        <div className="max-w-[680px] mx-auto">
          <h2 className="text-[28px] md:text-[36px] font-bold tracking-[-0.02em] mb-4">
            开始生成你的广告素材
          </h2>
          <p className="text-[17px] text-[#666] mb-8">
            不用注册，不用付费，先试再说。
          </p>
          <button
            onClick={onStart}
            className="text-[15px] font-medium bg-[#111] text-white h-11 px-7 rounded-lg hover:bg-[#333] transition-colors inline-flex items-center gap-2"
          >
            免费开始 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-[#E5E5E5]">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          <span className="text-[12px] text-[#BBB]">© 2026 100x</span>
          <a
            href="https://withhuman.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[#BBB] hover:text-[#888] transition-colors"
          >
            WithHuman.ai
          </a>
        </div>
      </footer>
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {!showWizard ? (
        <HomeContent onStart={handleStart} onSettings={() => setShowSettings(true)} />
      ) : (
        <div className="min-h-screen flex flex-col bg-[#FAFAFA]" key={wizardKey}>
          {/* Wizard header */}
          <header className="sticky top-0 z-50 bg-[#FAFAFA]/95 backdrop-blur-xl border-b border-[#E5E5E5] px-6 py-3">
            <div className="max-w-[640px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo100x size={22} />
                <span className="font-semibold text-[15px] tracking-tight">100x</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-[#999] hover:text-[#111] transition-colors rounded-md hover:bg-[#F0F0F0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center px-6 py-10">
            <div className="w-full max-w-[640px]">
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
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 h-11 border-[#E5E5E5] text-[#555] hover:text-[#111] hover:border-[#CCC] rounded-lg"
                    >
                      上一步
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="flex-1 h-11 bg-[#111] hover:bg-[#333] text-white rounded-lg font-medium"
                  >
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
