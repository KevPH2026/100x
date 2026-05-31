"use client";

import { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, Check, MessageSquare, Loader2, ChevronDown, ChevronUp, Send } from "lucide-react";

const PROGRESS_LABELS = ["解析素材", "提炼卖点", "生成文案", "绘制设计"];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

export function Step5Generating() {
  const { generationProgress, isGenerating, copyOptions, designResults, setStep, reset } = useWizardStore();

  // Chat state for iterative refinement
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Read settings from store / localStorage
  const { materials, scene, styleTags, audiences, goal } = useWizardStore();

  async function handleRegenerate(instruction: string) {
    if (!instruction.trim()) return;
    setIsRegenerating(true);
    setChatInput("");

    const userMsg: ChatMessage = { role: "user", content: instruction };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      // Build a minimal request to re-generate
      const settings = JSON.parse(localStorage.getItem("idealab-settings") || "{}");
      const body: Record<string, any> = {
        materials: materials.map(m => m.type === "file" ? { type: m.type, name: m.name, preview: m.preview, content: m.content } : m),
        scene,
        styleTags,
        audiences,
        goal,
        userOpenRouterKey: settings.openrouterKey || "",
        userMiniMaxKey: settings.minimaxKey || "",
        visionModel: settings.visionModel,
        copyModel: settings.copyModel,
        imageModel: settings.imageModel,
        refinementInstruction: instruction,
        previousCopy: copyOptions,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.error || "重新生成失败" }]);
        return;
      }

      // Update results in store
      if (data.copyOptions?.length) {
        useWizardStore.getState().setResults(data.copyOptions, data.designs || designResults);
      } else if (data.designs?.length) {
        useWizardStore.getState().setResults(copyOptions, data.designs);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "已根据你的要求重新生成 ✨",
        images: data.designs?.map((d: any) => d.imageUrl).filter(Boolean) || [],
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "网络错误，请重试" }]);
    } finally {
      setIsRegenerating(false);
    }
  }

  if (!isGenerating && copyOptions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20">
        <div className="text-4xl">😕</div>
        <h2 className="text-2xl font-bold">生成遇到问题</h2>
        <p className="text-muted-foreground">请检查网络连接后重试</p>
        <Button onClick={() => { setStep(4); }}>重新尝试</Button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-8 py-20">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI 正在生成中...</h2>
          <p className="text-muted-foreground">预计需要 30-60 秒，请稍候</p>
        </div>

        <div className="space-y-4">
          <Progress value={generationProgress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {PROGRESS_LABELS[Math.floor(generationProgress / 25)]}...
          </p>
        </div>

        <div className="flex justify-center gap-8 mt-10">
          {PROGRESS_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                generationProgress > i * 25 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {generationProgress > i * 25 ? "✓" : i + 1}
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Check className="w-4 h-4" /> 生成完成
        </div>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>文案 {copyOptions.length} 条</span>
          <span>设计稿 {designResults.length} 张</span>
        </div>
      </div>

      <Tabs defaultValue="designs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="designs">📐 设计稿</TabsTrigger>
          <TabsTrigger value="copy">✍️ 文案</TabsTrigger>
        </TabsList>

        <TabsContent value="designs" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {designResults.map((d) => (
              <Card key={d.id} className="overflow-hidden">
                {d.imageUrl ? (
                  <img src={d.imageUrl} alt="设计稿" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-secondary flex items-center justify-center text-muted-foreground text-sm">
                    暂无图片
                  </div>
                )}
                <div className="p-3 flex gap-2">
                  {d.imageUrl && (
                    <Button size="sm" className="flex-1" onClick={() => {
                      const a = document.createElement("a");
                      a.href = d.imageUrl;
                      a.download = `idealab-design-${d.id}.png`;
                      a.target = "_blank";
                      a.click();
                    }}>
                      <Download className="w-3 h-3 mr-1" /> 下载
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="copy" className="mt-4 space-y-3">
          {copyOptions.map((c, i) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">方案 {i + 1}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = `${c.headline}\n${c.subheadline}\n\n${c.body}\n\n${c.cta}`;
                    navigator.clipboard.writeText(text);
                  }}
                >
                  <Check className="w-3 h-3 mr-1" /> 复制
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">主标题</span>
                  <p className="font-bold">{c.headline}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">副标题</span>
                  <p className="text-sm">{c.subheadline}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">正文</span>
                  <p className="text-sm text-secondary-foreground">{c.body}</p>
                </div>
                {c.cta && (
                  <div>
                    <span className="text-xs text-muted-foreground">行动号召</span>
                    <p className="text-sm font-medium text-primary">{c.cta}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ── 对话式迭代调整区域 ─────────────────────────────────── */}
      <div className="border rounded-xl overflow-hidden">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="w-4 h-4" />
            不满意？说句话调整
            <span className="text-xs text-muted-foreground font-normal">「换个风格」「再活泼一点」「换个颜色」</span>
          </div>
          {chatOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {chatOpen && (
          <div className="p-4 space-y-3">
            {/* Chat history */}
            {chatMessages.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}>
                      <p>{msg.content}</p>
                      {msg.images?.map((url, j) => (
                        <img key={j} src={url} alt="" className="mt-2 rounded w-full max-w-[200px]" />
                      ))}
                    </div>
                  </div>
                ))}
                {isRegenerating && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-3 h-3 animate-spin" /> 重新生成中...
                  </div>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {["换一版", "风格再大胆一点", "文案再简洁", "换配色"].map((hint) => (
                <button
                  key={hint}
                  onClick={() => handleRegenerate(hint)}
                  disabled={isRegenerating}
                  className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {hint}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRegenerate(chatInput);
                  }
                }}
                placeholder="告诉我你想怎么改..."
                disabled={isRegenerating}
                className="flex-1"
              />
              <Button
                onClick={() => handleRegenerate(chatInput)}
                disabled={isRegenerating || !chatInput.trim()}
                size="icon"
              >
                {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="secondary" onClick={() => setStep(4)}>← 修改</Button>
        <Button variant="outline" onClick={reset}>开始新创作</Button>
      </div>
    </div>
  );
}
