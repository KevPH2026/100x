"use client";

import { create } from "zustand";

export interface Material {
  id: string;
  type: "file" | "link" | "text";
  name: string;
  content: string;
  preview?: string;
}

export interface SceneOption {
  id: string;
  label: string;
  ratio: string;
  icon: string;
  width: number;
  height: number;
}

export const SCENES: SceneOption[] = [
  { id: "friend_circle", label: "朋友圈海报", ratio: "1:1", icon: "🖼", width: 1080, height: 1080 },
  { id: "community", label: "社群推广图", ratio: "3:4", icon: "💬", width: 810, height: 1080 },
  { id: "wechat_cover", label: "公众号封面", ratio: "2.35:1", icon: "📱", width: 900, height: 383 },
  { id: "douyin", label: "抖音封面", ratio: "9:16", icon: "🎬", width: 1080, height: 1920 },
  { id: "xiaohongshu", label: "小红书笔记", ratio: "3:4", icon: "📕", width: 1080, height: 1440 },
  { id: "jd", label: "京东主图", ratio: "1:1", icon: "🛒", width: 800, height: 800 },
  { id: "banner", label: "官网Banner", ratio: "3:1", icon: "🌐", width: 1920, height: 640 },
  { id: "custom", label: "自定义尺寸", ratio: "自定义", icon: "⚙️", width: 1080, height: 1080 },
];

export const STYLE_TAGS = [
  "科技感", "温暖人文", "简约高级", "国潮", "电影感", "复古怀旧", "赛博朋克"
];

export const AUDIENCES = [
  { id: "gen_z", label: "Z世代", sub: "18-25岁" },
  { id: "young_professional", label: "年轻职场人", sub: "25-35岁" },
  { id: "mid_consumer", label: "中产消费者", sub: "35-45岁" },
  { id: "entrepreneur", label: "创业老板/CEO", sub: "" },
  { id: "mom", label: "宝妈群体", sub: "" },
  { id: "b2b", label: "B端决策者", sub: "" },
];

export const GOALS = [
  { id: "curiosity", label: "引发好奇", sub: "钩子型文案", icon: "🎣" },
  { id: "purchase", label: "促成下单", sub: "促销型文案", icon: "💰" },
  { id: "trust", label: "建立信任", sub: "背书型文案", icon: "🤝" },
  { id: "viral", label: "传播分享", sub: "社交货币型", icon: "🔥" },
  { id: "recruit", label: "招募代理", sub: "招募型文案", icon: "👥" },
];

export interface CopyOption {
  id: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
}

export interface DesignResult {
  id: string;
  imageUrl: string;
}

interface WizardState {
  step: number;
  materials: Material[];
  scene: SceneOption | null;
  customWidth: string;
  customHeight: string;
  styleTags: string[];
  styleRefImage: string | null;
  audiences: string[];
  goal: string;
  isGenerating: boolean;
  generationProgress: number;
  copyOptions: CopyOption[];
  designResults: DesignResult[];
  
  setStep: (s: number) => void;
  addMaterial: (m: Material) => void;
  removeMaterial: (id: string) => void;
  setScene: (s: SceneOption) => void;
  setCustomSize: (w: string, h: string) => void;
  setStyleTags: (tags: string[]) => void;
  setStyleRefImage: (url: string | null) => void;
  setAudiences: (ids: string[]) => void;
  setGoal: (id: string) => void;
  setGenerating: (v: boolean) => void;
  setProgress: (p: number) => void;
  setResults: (copy: CopyOption[], designs: DesignResult[]) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  materials: [],
  scene: null,
  customWidth: "1080",
  customHeight: "1080",
  styleTags: [],
  styleRefImage: null,
  audiences: [],
  goal: "",
  isGenerating: false,
  generationProgress: 0,
  copyOptions: [],
  designResults: [],
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,
  setStep: (s) => set({ step: s }),
  addMaterial: (m) => set((state) => ({ materials: [...state.materials, m] })),
  removeMaterial: (id) => set((state) => ({ materials: state.materials.filter((m) => m.id !== id) })),
  setScene: (scene) => set({ scene }),
  setCustomSize: (w, h) => set({ customWidth: w, customHeight: h }),
  setStyleTags: (tags) => set({ styleTags: tags }),
  setStyleRefImage: (url) => set({ styleRefImage: url }),
  setAudiences: (ids) => set({ audiences: ids }),
  setGoal: (id) => set({ goal: id }),
  setGenerating: (v) => set({ isGenerating: v }),
  setProgress: (p) => set({ generationProgress: p }),
  setResults: (copy, designs) => set({ copyOptions: copy, designResults: designs, isGenerating: false }),
  reset: () => set(initialState),
}));
