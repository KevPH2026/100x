"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, EyeOff, Check, AlertCircle, Sparkles } from "lucide-react";
import { useSettingsStore } from "@/lib/settingsStore";

const VISION_MODELS = [
  { id: "qwen/qwen2.5-vl-72b-instruct", label: "Qwen2.5-VL 72B", provider: "OpenRouter", desc: "视觉理解最强" },
  { id: "anthropic/claude-sonnet-4-7-20251119", label: "Claude Sonnet 4", provider: "OpenRouter", desc: "速度快，效果好" },
  { id: "google/gemini-2.0-flash-exp", label: "Gemini 2.0 Flash", provider: "OpenRouter", desc: "免费额度多" },
];

const COPY_MODELS = [
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenRouter", desc: "文案能力最强" },
  { id: "anthropic/claude-sonnet-4-7-20251119", label: "Claude Sonnet 4", provider: "OpenRouter", desc: "创意文案" },
  { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen2.5 72B", provider: "OpenRouter", desc: "性价比高" },
];

const IMAGE_MODELS = [
  { id: "image-01", label: "MiniMax Image-01", provider: "MiniMax", desc: "默认推荐" },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettingsStore();
  const {
    openrouterKey, setOpenrouterKey,
    minimaxKey, setMinimaxiKey,
    visionModel, setVisionModel,
    copyModel, setCopyModel,
    imageModel, setImageModel,
    openrouterEnabled, setOpenrouterEnabled,
    minimaxEnabled, setMinimaxiEnabled,
    checkIsConfigured,
  } = settings;

  const isConfigured = settings.isConfigured();

  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [showMiniMax, setShowMiniMax] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    checkIsConfigured();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0a0a14] border border-purple-500/20 rounded-3xl shadow-2xl shadow-purple-500/10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a14] border-b border-purple-500/10 px-8 py-6 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              设置
            </h2>
            <p className="text-gray-400 text-sm mt-1">配置你的 API Key 和模型偏好</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </Button>
        </div>

        <div className="p-8 space-y-8">
          {/* Status Banner */}
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${
            isConfigured
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-amber-500/10 border border-amber-500/20"
          }`}>
            {isConfigured ? (
              <>
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-300 text-sm">已配置，可以使用 AI 生成功能</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="text-amber-300 text-sm">
                  未配置 API Key，功能受限。填入 Key 或使用服务端预设额度。
                </span>
              </>
            )}
          </div>

          <Tabs defaultValue="keys" className="w-full">
            <TabsList className="bg-purple-500/10 border border-purple-500/20 mb-6">
              <TabsTrigger value="keys" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                API Key
              </TabsTrigger>
              <TabsTrigger value="models" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                模型选择
              </TabsTrigger>
              <TabsTrigger value="preset" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                服务端预设
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="keys" className="space-y-6">
              {/* OpenRouter */}
              <Card className="p-6 bg-white/5 border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">OpenRouter Key</h3>
                    <p className="text-xs text-gray-400 mt-0.5">用于视觉理解和文案生成</p>
                  </div>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                    可选
                  </Badge>
                </div>
                <div className="relative">
                  <Input
                    type={showOpenRouter ? "text" : "password"}
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    placeholder="sk-or-v2-..."
                    className="bg-white/5 border-purple-500/20 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouter(!showOpenRouter)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showOpenRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  从 <a href="https://openrouter.ai/keys" target="_blank" className="text-purple-400 hover:underline">openrouter.ai/keys</a> 获取
                </p>
              </Card>

              {/* MiniMax */}
              <Card className="p-6 bg-white/5 border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">MiniMax Key</h3>
                    <p className="text-xs text-gray-400 mt-0.5">用于图片生成</p>
                  </div>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                    可选
                  </Badge>
                </div>
                <div className="relative">
                  <Input
                    type={showMiniMax ? "text" : "password"}
                    value={minimaxKey}
                    onChange={(e) => setMinimaxiKey(e.target.value)}
                    placeholder="sk-cp-..."
                    className="bg-white/5 border-purple-500/20 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMiniMax(!showMiniMax)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showMiniMax ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  从 <a href="https://platform.minimax.chat/apikey" target="_blank" className="text-purple-400 hover:underline">platform.minimax.chat</a> 获取
                </p>
              </Card>
            </TabsContent>

            {/* Models Tab */}
            <TabsContent value="models" className="space-y-4">
              {/* Vision Model */}
              <div>
                <Label className="text-white font-semibold mb-3 block">视觉理解模型</Label>
                <div className="space-y-2">
                  {VISION_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setVisionModel(m.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        visionModel === m.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 bg-white/5 hover:border-purple-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{m.label}</p>
                          <p className="text-xs text-gray-400">{m.desc}</p>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">{m.provider}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Copy Model */}
              <div>
                <Label className="text-white font-semibold mb-3 block">文案生成模型</Label>
                <div className="space-y-2">
                  {COPY_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setCopyModel(m.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        copyModel === m.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 bg-white/5 hover:border-purple-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{m.label}</p>
                          <p className="text-xs text-gray-400">{m.desc}</p>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">{m.provider}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Model */}
              <div>
                <Label className="text-white font-semibold mb-3 block">图片生成模型</Label>
                <div className="space-y-2">
                  {IMAGE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setImageModel(m.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        imageModel === m.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 bg-white/5 hover:border-purple-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{m.label}</p>
                          <p className="text-xs text-gray-400">{m.desc}</p>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">{m.provider}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Preset Tab */}
            <TabsContent value="preset">
              <Card className="p-6 bg-white/5 border-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">使用服务端预设额度</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      不填 API Key 时，系统将使用 IdeaLab 服务端的共享额度，优先从你的账户扣除。
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">视觉模型</span>
                        <span className="text-white font-medium">Qwen2.5-VL 72B</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">文案模型</span>
                        <span className="text-white font-medium">GPT-4o</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">图片模型</span>
                        <span className="text-white font-medium">MiniMax Image-01</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      ⚠️ 额度有限，建议自填 API Key 以获得更稳定的体验。
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[#0a0a14] border-t border-purple-500/10 px-8 py-5 flex items-center justify-between rounded-b-3xl">
          <p className="text-xs text-gray-500">
            你的 Key 仅保存在本地浏览器，不会发送到服务端
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="border-purple-500/30 text-gray-300 hover:bg-white/5">
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
            >
              {saved ? "✓ 已保存" : "保存设置"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
