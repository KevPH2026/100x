"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle, Check, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleRegister() {
    setMsg(null);

    if (!email || !password || !confirmPassword) {
      setMsg({ type: "error", text: "请填写所有必填字段" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg({ type: "error", text: "请输入有效的邮箱地址" });
      return;
    }
    if (password.length < 6) {
      setMsg({ type: "error", text: "密码至少 6 位" });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "两次密码输入不一致" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          inviteCode: inviteCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "注册失败，请重试" });
      } else {
        setMsg({ type: "success", text: "注册成功！正在跳转到登录页…" });
        setTimeout(() => {
          router.push("/login?registered=1");
        }, 800);
      }
    } catch {
      setMsg({ type: "error", text: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 3C14 3 10 7 10 12C10 14.5 11.5 16.5 14 17.5C16.5 18.5 18 20.5 18 23"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="14" cy="11" r="4" fill="white" />
              <path d="M14 21V25" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M10 25H18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">IdeaLab</h1>
          <p className="text-zinc-400 text-sm mt-1">AI 灵感创作平台</p>
        </div>

        <Card className="p-8 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-3xl">
          <h2 className="text-lg font-semibold text-white mb-1">创建账号</h2>
          <p className="text-zinc-400 text-sm mb-6">填写信息完成注册</p>

          {/* Message Banner */}
          {msg && (
            <div
              className={`mb-5 flex items-center gap-2 text-sm rounded-xl p-3 ${
                msg.type === "error"
                  ? "text-red-400 bg-red-950/60 border border-red-900/50"
                  : "text-emerald-400 bg-emerald-950/60 border border-emerald-900/50"
              }`}
            >
              {msg.type === "error" ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Check className="w-4 h-4 flex-shrink-0" />
              )}
              {msg.text}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              邮箱 <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              autoComplete="email"
              className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                autoComplete="new-password"
                className="h-11 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                className="h-11 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Invite Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              邀请码
              <span className="ml-1.5 text-xs text-zinc-500 font-normal">（选填）</span>
            </label>
            <Input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXX"
              autoComplete="off"
              spellCheck={false}
              className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl tracking-widest font-mono uppercase"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleRegister}
            disabled={loading || !email || !password || !confirmPassword}
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-800 disabled:to-indigo-800 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? "注册中…" : "创建账号"}
          </Button>

          {/* Login Link */}
          <p className="text-center text-zinc-500 text-sm mt-5">
            已有账号？{" "}
            <Link
              href="/login"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              立即登录
            </Link>
          </p>
        </Card>

        <p className="text-center text-zinc-600 text-xs mt-6">
          注册即表示同意{" "}
          <span className="text-violet-500 cursor-pointer hover:text-violet-400">服务条款</span>{" "}
          和{" "}
          <span className="text-violet-500 cursor-pointer hover:text-violet-400">隐私政策</span>
        </p>
      </div>
    </div>
  );
}
