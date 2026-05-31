"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle, Check, Loader2 } from "lucide-react";

function LoginForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleEmailLogin() {
    if (!email || !password) return;
    setLoading(true); setMsg(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setMsg({ type: "error", text: "邮箱或密码错误" });
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleRegister() {
    if (!email || !password) return;
    if (password.length < 6) { setMsg({ type: "error", text: "密码至少6位" }); return; }
    setLoading(true); setMsg(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, inviteCode: inviteCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "error", text: data.error || "注册失败" }); }
      else {
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) { setMsg({ type: "error", text: "注册成功但登录失败，请手动登录" }); }
        else { router.push(callbackUrl); }
      }
    } catch { setMsg({ type: "error", text: "网络错误，请重试" }); }
    finally { setLoading(false); }
  }

  return (
    <>
      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error === "OAuthAccountNotLinked" ? "该邮箱已用其他方式注册，请用原方式登录" : "登录失败，请重试"}
        </div>
      )}

      {msg && (
        <div className={`mb-4 flex items-center gap-2 text-sm rounded-xl p-3 ${msg.type === "error" ? "text-red-500 bg-red-50" : "text-green-600 bg-green-50"}`}>
          {msg.type === "error" ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
          {msg.text}
        </div>
      )}

      {mode === "register" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称（选填）</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="你怎么称呼都行" className="h-11" />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="h-11" autoFocus />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
        <div className="relative">
          <Input type={showPw ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleEmailLogin() : handleRegister())}
            placeholder={mode === "register" ? "至少6位" : "输入密码"} className="h-11 pr-10" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mode === "register" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            邀请码 <span className="text-xs text-gray-400 font-normal">（选填）</span>
          </label>
          <Input
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXX"
            autoComplete="off"
            spellCheck={false}
            className="h-11 tracking-widest font-mono uppercase"
          />
        </div>
      )}

      <Button onClick={mode === "login" ? handleEmailLogin : handleRegister}
        disabled={loading || !email || !password}
        className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {mode === "login" ? "登录" : "注册"}
      </Button>
    </>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C14 3 10 7 10 12C10 14.5 11.5 16.5 14 17.5C16.5 18.5 18 20.5 18 23" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="14" cy="11" r="4" fill="white"/>
              <path d="M14 21V25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M10 25H18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">100x</h1>
          <p className="text-gray-500 text-sm mt-1">AI 灵感创作平台</p>
        </div>

        <Card className="p-8 bg-white shadow-xl border-0 rounded-3xl">
          {/* Mode Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button onClick={() => { setMode("login"); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
              登录
            </button>
            <button onClick={() => { setMode("register"); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
              注册
            </button>
          </div>

          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}>
            <LoginForm key={mode} mode={mode} />
          </Suspense>
        </Card>

        <p className="text-center text-gray-400 text-xs mt-6">
          注册即表示同意 <span className="text-violet-500">服务条款</span> 和 <span className="text-violet-500">隐私政策</span>
        </p>
      </div>
    </div>
  );
}
