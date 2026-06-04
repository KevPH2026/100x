'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, AlertCircle, Check, Loader2, Building2, User, Phone, Mail, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  function validateStep1(): boolean {
    if (!email) { setMsg({ type: 'error', text: '请输入邮箱' }); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg({ type: 'error', text: '邮箱格式不正确' }); return false; }
    if (!password) { setMsg({ type: 'error', text: '请输入密码' }); return false; }
    if (password.length < 6) { setMsg({ type: 'error', text: '密码至少6位' }); return false; }
    return true;
  }

  async function handleRegister() {
    if (!name.trim()) { setMsg({ type: 'error', text: '请输入你的姓名' }); return; }
    if (!company.trim()) { setMsg({ type: 'error', text: '请输入公司名称' }); return; }

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name.trim(), company: company.trim(), phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || '注册失败' });
      } else {
        setMsg({ type: 'success', text: '注册成功！正在登录…' });
        try {
          await signIn('credentials', { email, password, callbackUrl: '/chat' });
        } catch {
          router.push(`/login?registered=1&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent('/chat')}`);
        }
      }
    } catch {
      setMsg({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">100x</h1>
          <p className="text-zinc-500 text-xs mt-0.5">免费注册，开始生成广告素材</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 1 ? 'text-violet-400' : 'text-zinc-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>1</div>
              账号
            </div>
            <div className="flex-1 h-px bg-zinc-800" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 2 ? 'text-violet-400' : 'text-zinc-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
              信息
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div className={`mb-4 flex items-center gap-2 text-xs rounded-lg p-2.5 ${
              msg.type === 'error'
                ? 'text-red-400 bg-red-950/60 border border-red-900/50'
                : 'text-emerald-400 bg-emerald-950/60 border border-emerald-900/50'
            }`}>
              {msg.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
              {msg.text}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoFocus
                    className="w-full h-10 pl-9 pr-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="至少6位"
                    onKeyDown={e => { if (e.key === 'Enter' && validateStep1()) setStep(2); }}
                    className="w-full h-10 pl-9 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors mt-2"
              >
                下一步
              </button>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  你的姓名 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="张三"
                    autoFocus
                    className="w-full h-10 pl-9 pr-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  公司名称 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="你的品牌/公司名"
                    className="w-full h-10 pl-9 pr-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  联系电话 <span className="text-zinc-600 text-[10px]">选填，方便我们联系你</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="138-xxxx-xxxx"
                    onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
                    className="w-full h-10 pl-9 pr-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="h-10 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 h-10 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? '注册中…' : '免费注册'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-5">
          已有账号？{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">登录</Link>
        </p>
      </div>
    </div>
  );
}
