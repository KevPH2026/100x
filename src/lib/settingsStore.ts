"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  // User's own API keys (stored in browser localStorage)
  openrouterKey: string;
  minimaxKey: string;

  // Model preferences
  visionModel: string;
  copyModel: string;
  imageModel: string;

  // Whether to use server-side preset keys (when user doesn't provide their own)
  openrouterEnabled: boolean;
  minimaxEnabled: boolean;

  // Actions
  setOpenrouterKey: (key: string) => void;
  setMinimaxiKey: (key: string) => void;
  setVisionModel: (model: string) => void;
  setCopyModel: (model: string) => void;
  setImageModel: (model: string) => void;
  setOpenrouterEnabled: (v: boolean) => void;
  setMinimaxiEnabled: (v: boolean) => void;

  // Derived: is any API key configured
  isConfigured: () => boolean;
  checkIsConfigured: () => void;

  // Get effective keys: user's key takes priority, otherwise fallback to server preset
  getEffectiveOpenRouterKey: (serverPresetKey: string | undefined) => string;
  getEffectiveMiniMaxKey: (serverPresetKey: string | undefined) => string;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      openrouterKey: "",
      minimaxKey: "",
      visionModel: "qwen/qwen2.5-vl-72b-instruct",
      copyModel: "openai/gpt-4o",
      imageModel: "image-01",
      openrouterEnabled: true,
      minimaxEnabled: true,

      setOpenrouterKey: (key) => set({ openrouterKey: key }),
      setMinimaxiKey: (key) => set({ minimaxKey: key }),
      setVisionModel: (model) => set({ visionModel: model }),
      setCopyModel: (model) => set({ copyModel: model }),
      setImageModel: (model) => set({ imageModel: model }),
      setOpenrouterEnabled: (v) => set({ openrouterEnabled: v }),
      setMinimaxiEnabled: (v) => set({ minimaxEnabled: v }),

      isConfigured: () => {
        const { openrouterKey, minimaxKey, openrouterEnabled, minimaxEnabled } = get();
        return openrouterKey.length > 0 || minimaxKey.length > 0 || openrouterEnabled || minimaxEnabled;
      },

      checkIsConfigured: () => {
        // Trigger re-render to update isConfigured
        set((state) => ({ ...state }));
      },

      getEffectiveOpenRouterKey: (serverPresetKey) => {
        const { openrouterKey } = get();
        return openrouterKey.trim() || serverPresetKey || "";
      },

      getEffectiveMiniMaxKey: (serverPresetKey) => {
        const { minimaxKey } = get();
        return minimaxKey.trim() || serverPresetKey || "";
      },
    }),
    {
      name: "idealab-settings",
      // Only persist the keys, not sensitive data
      partialize: (state) => ({
        openrouterKey: state.openrouterKey,
        minimaxKey: state.minimaxKey,
        visionModel: state.visionModel,
        copyModel: state.copyModel,
        imageModel: state.imageModel,
        openrouterEnabled: state.openrouterEnabled,
        minimaxEnabled: state.minimaxEnabled,
      }),
    }
  )
);
