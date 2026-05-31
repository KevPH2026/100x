"use client";

import { useWizardStore, AUDIENCES, GOALS } from "@/lib/store";
import { useSettingsStore } from "@/lib/settingsStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Step4Audience() {
  const wizard = useWizardStore();
  const settings = useSettingsStore();
  const { audiences, goal, setAudiences, setGoal, setStep, setGenerating, setProgress, setResults } = wizard;

  const toggleAudience = (id: string) => {
    if (audiences.includes(id)) {
      setAudiences(audiences.filter((a) => a !== id));
    } else {
      setAudiences([...audiences, id]);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setStep(5);

    let prog = 0;
    const interval = setInterval(() => {
      prog = Math.min(prog + 8, 90);
      setProgress(prog);
    }, 500);

    // Use AbortController with 120s timeout (AI generation can take 30-60s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      // Build request body with user settings
      const state = wizard;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          materials: state.materials,
          scene: state.scene,
          styleTags: state.styleTags,
          audiences: state.audiences,
          goal: state.goal,
          // Pass user's API keys and model choices
          userOpenRouterKey: settings.openrouterKey,
          userMiniMaxKey: settings.minimaxKey,
          visionModel: settings.visionModel,
          copyModel: settings.copyModel,
          imageModel: settings.imageModel,
        }),
      });
      clearTimeout(timeout);
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);
      if (data.error) {
        // Show error and go back
        setGenerating(false);
        setStep(4);
        alert(data.error);
        return;
      }
      setResults(data.copyOptions || [], data.designs || []);
    } catch (err: any) {
      clearInterval(interval);
      clearTimeout(timeout);
      setGenerating(false);
      setStep(4);
      if (err?.name === "AbortError") {
        alert("生成超时（120秒），请重试或稍后再试");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Step 4: 受众与目的</h2>
        <p className="text-muted-foreground">明确你的目标人群和推广目的</p>
      </div>

      {/* Audience */}
      <div>
        <p className="text-sm font-medium mb-3">目标受众（可多选）</p>
        <div className="grid grid-cols-3 gap-3">
          {AUDIENCES.map((a) => {
            const isSelected = audiences.includes(a.id);
            return (
              <Card
                key={a.id}
                className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                  isSelected ? "ring-2 ring-primary bg-primary/20" : "hover:bg-secondary"
                }`}
                onClick={() => toggleAudience(a.id)}
              >
                <div className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{a.label}</div>
                {a.sub && <div className="text-xs text-muted-foreground mt-1">{a.sub}</div>}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Goal */}
      <div>
        <p className="text-sm font-medium mb-3">推广目的（单选）</p>
        <div className="grid grid-cols-1 gap-3">
          {GOALS.map((g) => {
            const isSelected = goal === g.id;
            return (
              <Card
                key={g.id}
                className={`p-4 cursor-pointer transition-all flex items-center gap-3 ${
                  isSelected ? "ring-2 ring-primary bg-primary/20" : "hover:bg-secondary"
                }`}
                onClick={() => setGoal(g.id)}
              >
                <div className="text-2xl">{g.icon}</div>
                <div>
                  <div className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{g.label}</div>
                  <div className="text-xs text-muted-foreground">{g.sub}</div>
                </div>
                {isSelected && <div className="ml-auto text-green-500">✓</div>}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(3)}>← 上一步</Button>
        <Button onClick={handleGenerate} disabled={audiences.length === 0 || !goal}>
          开始AI生成 →
        </Button>
      </div>
    </div>
  );
}
