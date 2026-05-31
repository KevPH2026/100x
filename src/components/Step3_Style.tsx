"use client";

import { useState } from "react";
import { useWizardStore, STYLE_TAGS } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Step3Style() {
  const { styleTags, setStyleTags, setStep } = useWizardStore();

  const toggleTag = (tag: string) => {
    if (styleTags.includes(tag)) {
      setStyleTags(styleTags.filter((t) => t !== tag));
    } else if (styleTags.length < 3) {
      setStyleTags([...styleTags, tag]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Step 3: 风格选择</h2>
        <p className="text-muted-foreground">选择 1-3 个风格标签，最多选3个</p>
      </div>

      {/* Style Tags */}
      <div className="grid grid-cols-3 gap-3">
        {STYLE_TAGS.map((tag) => {
          const isSelected = styleTags.includes(tag);
          return (
            <Card
              key={tag}
              className={`p-6 cursor-pointer text-center transition-all hover:scale-105 ${
                isSelected ? "ring-2 ring-primary bg-primary/20" : "hover:bg-secondary"
              }`}
              onClick={() => toggleTag(tag)}
            >
              <div className={`text-2xl mb-2 ${isSelected ? "opacity-100" : "opacity-60"}`}>
                {tag === "科技感" ? "🤖" : tag === "温暖人文" ? "🌿" : tag === "简约高级" ? "✨" : tag === "国潮" ? "🏮" : tag === "电影感" ? "🎬" : tag === "复古怀旧" ? "📜" : "🌃"}
              </div>
              <div className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{tag}</div>
              {isSelected && <div className="mt-2 text-green-500 text-xs">✓ 已选择</div>}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(2)}>← 上一步</Button>
        <Button onClick={() => setStep(4)} disabled={styleTags.length === 0}>下一步 →</Button>
      </div>
    </div>
  );
}
