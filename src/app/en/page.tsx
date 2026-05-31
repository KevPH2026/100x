import Link from "next/link";
import { IdeaLabLogo } from "@/components/Logo";

export default function EnglishPage() {
  return (
    <div className="min-h-screen bg-[#070711] text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#070711]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IdeaLabLogo size={36} />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              IdeaLab
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">
              中文
            </Link>
            <Link
              href="/"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/50 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              Try Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
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
            <span>✨ AI-Powered Content Generation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Drop your materials,{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              5 minutes
            </span>
            <br />
            to finished marketing content
          </h1>

          <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            Screenshots, documents, product images, competitor links — anything goes in. 
            IdeaLab analyzes it and generates publish-ready copy and design drafts automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="h-14 px-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-900/60 text-white text-lg font-semibold rounded-2xl border border-violet-500/30 flex items-center justify-center"
            >
              Start Creating Free →
            </Link>
            <Link
              href="/"
              className="h-14 px-10 border border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-lg font-semibold rounded-2xl backdrop-blur-sm flex items-center justify-center"
            >
              View in 中文
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-white/30">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white/60">4.9</span>
              <span>User Rating</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white/60">5 min</span>
              <span>Avg. Output</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white/60">100%</span>
              <span>Original Content</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">Sound Familiar?</p>
            <h2 className="text-4xl font-bold text-white mb-4">Content creation pain points, solved</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: "😤", title: "Endless revision cycles", desc: "Brief → draft → 'not quite' → draft → 'maybe add more' → draft → approved after 2 weeks" },
              { emoji: "🤯", title: "Writer's block hits hard", desc: "Staring at a blank canvas. The cursor blinks. The deadline is tomorrow." },
              { emoji: "💸", title: "Expensive design cycles", desc: "Each round-trip with designers costs time and money. Small changes become big bills." },
            ].map((p) => (
              <div key={p.title} className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
                <div className="text-4xl mb-5">{p.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
                <p className="text-white/40 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-center text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">How It Works</p>
          <h2 className="text-3xl font-bold text-white mb-14">4 simple steps, zero content anxiety</h2>
          <div className="grid grid-cols-4 gap-6">
            {[
              { step: "01", label: "Upload" },
              { step: "02", label: "Pick Scene" },
              { step: "03", label: "Set Style" },
              { step: "04", label: "AI Creates" },
            ].map((w) => (
              <div key={w.step} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40 text-white font-bold text-sm border border-violet-500/30">
                  {w.step}
                </div>
                <span className="text-sm font-medium text-white/60">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-violet-400 mb-3 uppercase tracking-widest">Use Cases</p>
            <h2 className="text-4xl font-bold text-white mb-4">One platform, endless content</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: "📱", title: "WeChat Moments", desc: "Viral marketing posts" },
              { icon: "📕", title: "Little Red Book", desc: "Influencer-style reviews" },
              { icon: "🛒", title: "E-commerce", desc: "Product descriptions" },
              { icon: "🌐", title: "Landing Pages", desc: "Sales copy that converts" },
              { icon: "📣", title: "Advertising", desc: "Ad creatives & copy" },
              { icon: "🎵", title: "Short Video", desc: "Script & captions" },
            ].map((c) => (
              <div key={c.title} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-violet-500/30 transition-all cursor-pointer">
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="font-bold text-white mb-1">{c.title}</h3>
                <p className="text-sm text-white/40">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-3xl p-16">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to create?</h2>
            <p className="text-white/50 text-lg mb-10">Join thousands of creators shipping content 10x faster</p>
            <Link
              href="/"
              className="h-14 px-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-2xl shadow-violet-900/60 text-white text-lg font-semibold rounded-2xl border border-violet-500/30 inline-flex items-center"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IdeaLabLogo size={28} />
            <span className="font-bold text-white/70">IdeaLab</span>
          </div>
          <p className="text-sm text-white/20">© 2026 IdeaLab · AI Content Creation Platform</p>
        </div>
      </footer>
    </div>
  );
}
