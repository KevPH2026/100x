"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Check, AlertCircle, Loader2, KeyRound } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  if (!token || !email) {
    return (
      <div className="text-center py-4 text-red-500 text-sm flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        重置链接无效，请重新申请
      </div>
    );
  }

  const handleReset = async () => {
    if (!newPassword || !confirmPw) return;
    if (newPassword.length < 6) { setMsg({ type: "error", text: "密码至少6位" }); return; }
    if (newPassword !== confirmPw) { setMsg({ type: "error", text: "两次密码不一致" }); return; }

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "重置失败" });
      } else {
        setMsg({ type: "success", text: "密码重置成功！3秒后跳转登录..." });
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setMsg({ type: "error", text: "网络错误" });
    }
    setLoading(false);
  };

  return (
    <>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-3">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">重置密码</h2>
        <p className="text-gray-500 text-sm mt-1">为 {email} 设置新密码</p>
      </div>

      {msg && (
        <div className={`mb-4 flex items-center gap-2 text-sm rounded-xl p-3 ${msg.type === "error" ? "text-red-500 bg-red-50" : "text-green-600 bg-green-50"}`}>
          {msg.type === "error" ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
        <div className="relative">
          <Input type={showPw ? "text" : "password"} value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="至少6位"
            className="h-11 pr-10 text-gray-900 placeholder:text-gray-400" autoFocus />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
        <Input type={showPw ? "text" : "password"} value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleReset()}
          placeholder="再输入一次"
          className="h-11 text-gray-900 placeholder:text-gray-400" />
      </div>

      <Button onClick={handleReset}
        disabled={loading || !newPassword || !confirmPw}
        className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        重置密码
      </Button>

      <button onClick={() => router.push("/login")} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700">
        ← 返回登录
      </button>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
            <span className="text-[9px] font-black text-white">100x</span>
          </div>
        </div>

        <Card className="p-8 bg-white shadow-xl border-0 rounded-3xl">
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}>
            <ResetForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
