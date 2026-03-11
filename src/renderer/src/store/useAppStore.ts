// ============================================================
// useAppStore — estado global da aplicação (navegação, tema, etc.)
// ============================================================
import { create } from "zustand";
import { AppSettings, DEFAULT_SETTINGS } from "@shared/types";
import { bridge } from "../utils/bridge";
import i18n from "../i18n";

type Page = "browse" | "installed" | "favorites" | "settings";

interface AppState {
  currentPage: Page;
  settings: AppSettings;
  settingsLoaded: boolean;
  previewText: string;
  viewMode: "grid" | "list";
  previewFontSize: number;

  setPage: (page: Page) => void;
  setPreviewText: (text: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setPreviewFontSize: (size: number) => void;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "browse",
  settings: DEFAULT_SETTINGS,
  settingsLoaded: false,
  previewText: "The quick brown fox jumps over the lazy dog",
  viewMode: "grid" as "grid" | "list",
  previewFontSize: 28,

  setPage: (page) => set({ currentPage: page }),

  setPreviewText: (text) => set({ previewText: text }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPreviewFontSize: (size) => set({ previewFontSize: size }),

  loadSettings: async () => {
    const res = await bridge.settings.get();
    if (res.success && res.data) {
      set({
        settings: res.data,
        previewText: res.data.previewText,
        settingsLoaded: true,
      });
      // Aplica o idioma salvo ao i18next
      if (res.data.language) {
        i18n.changeLanguage(res.data.language);
      }
    } else {
      // Garante que o app não fique preso em estado de loading
      set({ settingsLoaded: true });
    }
  },

  saveSettings: async (settings) => {
    const res = await bridge.settings.save(settings);
    if (res.success) {
      set({ settings, previewText: settings.previewText });
      // Aplica mudança de idioma imediatamente
      if (settings.language) {
        i18n.changeLanguage(settings.language);
      }
    }
  },
}));
