"use client";

import { useState } from "react";
import { useWizardStore, SCENES, STYLE_TAGS } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Step2Scene() {
  const { scene, customWidth, customHeight, setScene, setCustomSize, setStep } = useWizardStore();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Step 2: 场景配置</h2>
        <p className="text-muted-foreground">选择你的内容发布场景和尺寸</p>
      </div>

      {/* Scene Grid */}
      <div>
        <p className="text-sm font-medium mb-3">选择场景</p>
        <div className="grid grid-cols-4 gap-3">
          {SCENES.map((s) => (
            <Card
              key={s.id}
              className={`p-4 cursor-pointer text-center transition-all hover:scale-105 ${
                scene?.id === s.id ? "ring-2 ring-primary bg-primary/20" : "hover:bg-secondary"
              }`}
              onClick={() => setScene(s)}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.ratio}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Size */}
      {scene?.id === "custom" && (
        <div className="flex gap-4 items-center">
          <Input
            type="number"
            placeholder="宽度"
            value={customWidth}
            onChange={(e) => setCustomSize(e.target.value, customHeight)}
            className="w-32"
          />
          <span className="text-muted-foreground">×</span>
          <Input
            type="number"
            placeholder="高度"
            value={customHeight}
            onChange={(e) => setCustomSize(customWidth, e.target.value)}
            className="w-32"
          />
          <span className="text-muted-foreground text-sm">px</span>
        </div>
      )}

      {/* Size Info */}
      {scene && scene.id !== "custom" && (
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">输出尺寸</p>
          <p className="text-lg font-bold">{scene.width} × {scene.height} px</p>
          <p className="text-xs text-muted-foreground mt-1">比例 {scene.ratio}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(1)}>← 上一步</Button>
        <Button onClick={() => setStep(3)} disabled={!scene}>下一步 →</Button>
      </div>
    </div>
  );
}
