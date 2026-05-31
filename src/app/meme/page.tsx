'use client';

import { useState, useRef } from 'react';
import { Send, Loader2, Copy, Check, Download } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'cat looking confused',
  'penguin dancing happy',
  'robot facepalm',
  'fox screaming',
  'dog wearing sunglasses',
  'owl judging you',
];

export default function MemePage() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const generate = async (text?: string) => {
    const textToUse = (text ?? prompt).trim();
    if (!textToUse) return;

    setLoading(true);
    setError('');
    setImages([]);
    setShowExamples(false);

    try {
      const res = await fetch('/api/meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Generation failed');
      }

      const data = await res.json();
      setImages(data.images ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async (url: string, index: number) => {
    await navigator.clipboard.writeText(url);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadImage = async (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `meme-${Date.now()}-${index}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-lg">
            😎
          </div>
          <div>
            <h1 className="font-heading text-lg font-semibold text-primary">Emoji Forge</h1>
            <p className="text-xs text-muted-foreground">一句话生成专属表情包</p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-8">

        {/* Input Section */}
        <section>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="描述你想要的表情… 比如：一只生气的猫"
              maxLength={200}
              className="w-full h-14 px-5 pr-24 rounded-2xl bg-card border border-border/70 text-foreground placeholder:text-muted-foreground/50 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
            />
            <button
              onClick={() => generate()}
              disabled={!prompt.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              生成
            </button>
          </div>

          {/* Char count */}
          <div className="flex justify-end mt-1.5">
            <span className="text-xs text-muted-foreground">{prompt.length}/200</span>
          </div>

          {/* Examples */}
          {showExamples && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2.5 uppercase tracking-wider">试试这些</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map(ex => (
                  <button
                    key={ex}
                    onClick={() => {
                      setPrompt(ex);
                      generate(ex);
                    }}
                    className="px-3 py-1.5 rounded-full bg-card border border-border/60 text-sm text-foreground/80 hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">生成中，约 10-20 秒…</p>
          </div>
        )}

        {/* Results */}
        {!loading && images.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold">生成结果</h2>
              <span className="text-xs text-muted-foreground">右键保存 · 点击复制链接</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {images.map((url, i) => (
                <div key={i} className="relative group rounded-2xl overflow-hidden bg-card border border-border/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Generated emoji ${i + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => copyUrl(url, i)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition-all"
                    >
                      {copied === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === i ? '已复制' : '复制链接'}
                    </button>
                    <button
                      onClick={() => downloadImage(url, i)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Regenerate */}
            <div className="mt-6 text-center">
              <button
                onClick={() => generate()}
                className="px-6 py-2.5 rounded-xl border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                换一版 ↻
              </button>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && images.length === 0 && !error && !showExamples && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="text-5xl">🎨</div>
            <p className="text-muted-foreground text-sm">输入描述，点击生成</p>
          </div>
        )}
      </div>
    </div>
  );
}
