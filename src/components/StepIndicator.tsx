"use client";

import { useWizardStore } from "@/lib/store";

const STEPS = [
  { n: 1, label: "素材上传" },
  { n: 2, label: "场景配置" },
  { n: 3, label: "风格选择" },
  { n: 4, label: "受众目的" },
  { n: 5, label: "生成" },
];

export function StepIndicator() {
  const { step, setStep } = useWizardStore();

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const isActive = step === s.n;
        const isDone = step > s.n;
        return (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => { if (isDone || isActive) setStep(s.n); }}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
                ${isActive ? "bg-primary/30 ring-2 ring-primary" : ""}
                ${isDone ? "opacity-70 hover:opacity-100 cursor-pointer" : ""}
                ${!isActive && !isDone ? "opacity-40 cursor-default" : ""}
              `}
            >
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                ${isDone ? "bg-green-500 text-white" : ""}
                ${isActive ? "bg-primary text-primary-foreground" : ""}
                ${!isActive && !isDone ? "bg-secondary text-muted-foreground" : ""}
              `}>
                {isDone ? "✓" : s.n}
              </div>
              <span className={`text-xs whitespace-nowrap ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 rounded ${step > s.n ? "bg-green-500" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
