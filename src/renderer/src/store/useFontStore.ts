// ============================================================
// useFontStore — estado das fontes: listagem, filtros, seleção
// ============================================================
import { create } from "zustand";
import { Font, FontFilter, FontSource, PaginatedFonts } from "@shared/types";
import { bridge } from "../utils/bridge";

interface FontState {
  // Browse
  fonts: Font[];
  totalFonts: number;
  hasMore: boolean;
  currentPage: number;
  isLoading: boolean;
  loadError: string | null;

  // Filters
  filter: FontFilter;
  activeSource: FontSource | "all";

  // Selection / Preview
  selectedFont: Font | null;
  previewOpen: boolean;

  // Installed / Favorites (for their pages)
  installedFonts: Font[];
  favoriteFonts: Font[];

  // Actions
  setFilter: (filter: Partial<FontFilter>) => void;
  setActiveSource: (source: FontSource | "all") => void;
  selectFont: (font: Font | null) => void;
  togglePreview: (open: boolean) => void;

  fetchFonts: (
    source: FontSource,
    page?: number,
    reset?: boolean,
  ) => Promise<void>;
  fetchAllFonts: (page?: number, reset?: boolean) => Promise<void>;
  fetchInstalled: () => Promise<void>;
  fetchFavorites: () => Promise<void>;

  toggleFavorite: (font: Font) => Promise<void>;
  downloadFont: (font: Font) => Promise<void>;
  uninstallFont: (font: Font) => Promise<void>;

  updateFontInList: (fontId: string, updates: Partial<Font>) => void;
}

export const useFontStore = create<FontState>((set, get) => ({
  fonts: [],
  totalFonts: 0,
  hasMore: false,
  currentPage: 1,
  isLoading: false,
  loadError: null,

  filter: {
    sortBy: "popularity",
    sortOrder: "desc",
  },

  activeSource: "all",
  selectedFont: null,
  previewOpen: false,
  installedFonts: [],
  favoriteFonts: [],

  // -------------------------------------------------------
  setFilter: (partial) => {
    set((s) => ({ filter: { ...s.filter, ...partial } }));
  },

  setActiveSource: (source) => {
    set({ activeSource: source, fonts: [], currentPage: 1 });
  },

  selectFont: (font) => set({ selectedFont: font }),

  togglePreview: (open) => set({ previewOpen: open }),

  // -------------------------------------------------------
  fetchFonts: async (source, page = 1, reset = false) => {
    const { filter } = get();
    set({ isLoading: true, loadError: null });
    if (reset) set({ fonts: [], currentPage: 1 });

    try {
      const res = await bridge.fonts.list(source, page, 24, filter);
      if (res.success && res.data) {
        set((s) => ({
          fonts: reset ? res.data!.fonts : [...s.fonts, ...res.data!.fonts],
          totalFonts: res.data!.total,
          hasMore: res.data!.hasMore,
          currentPage: page,
          isLoading: false,
        }));
      } else {
        set({
          loadError: res.error || "Failed to fetch fonts",
          isLoading: false,
        });
      }
    } catch (err) {
      set({ loadError: String(err), isLoading: false });
    }
  },

  fetchAllFonts: async (page = 1, reset = false) => {
    const { filter } = get();
    set({ isLoading: true, loadError: null });
    if (reset) set({ fonts: [], currentPage: 1 });
    try {
      const res = await bridge.fonts.listAll(page, 24, filter);
      if (res.success && res.data) {
        set((s) => ({
          fonts: reset ? res.data!.fonts : [...s.fonts, ...res.data!.fonts],
          totalFonts: res.data!.total,
          hasMore: res.data!.hasMore,
          currentPage: page,
          isLoading: false,
        }));
      } else {
        set({
          loadError: res.error || "Failed to fetch fonts",
          isLoading: false,
        });
      }
    } catch (err) {
      set({ loadError: String(err), isLoading: false });
    }
  },

  fetchInstalled: async () => {
    const res = await bridge.fonts.getInstalled();
    if (res.success && res.data) {
      set({ installedFonts: res.data });
    }
  },

  fetchFavorites: async () => {
    const res = await bridge.fonts.getFavorites();
    if (res.success && res.data) {
      set({ favoriteFonts: res.data });
    }
  },

  // -------------------------------------------------------
  toggleFavorite: async (font) => {
    // Optimistic: atualiza imediatamente, reverte se falhar
    const snapshot = get().favoriteFonts;
    const newIsFavorite = !font.isFavorite;
    get().updateFontInList(font.id, { isFavorite: newIsFavorite });
    set((s) => ({
      favoriteFonts: newIsFavorite
        ? [...s.favoriteFonts, { ...font, isFavorite: true }]
        : s.favoriteFonts.filter((f) => f.id !== font.id),
    }));

    const res = await bridge.fonts.toggleFavorite(font.id);
    if (!res.success) {
      // Revert
      get().updateFontInList(font.id, { isFavorite: !newIsFavorite });
      set({ favoriteFonts: snapshot });
    }
  },

  downloadFont: async (font) => {
    await bridge.fonts.download(font);
    // Progress is handled via events in useDownloadStore
  },

  uninstallFont: async (font) => {
    const res = await bridge.fonts.uninstall(font.id, font.name);
    if (res.success) {
      get().updateFontInList(font.id, { isInstalled: false });
      set((s) => ({
        installedFonts: s.installedFonts.filter((f) => f.id !== font.id),
      }));
    }
  },

  // -------------------------------------------------------
  updateFontInList: (fontId, updates) => {
    set((s) => ({
      fonts: s.fonts.map((f) => (f.id === fontId ? { ...f, ...updates } : f)),
      installedFonts: s.installedFonts.map((f) =>
        f.id === fontId ? { ...f, ...updates } : f,
      ),
      favoriteFonts: s.favoriteFonts.map((f) =>
        f.id === fontId ? { ...f, ...updates } : f,
      ),
      selectedFont:
        s.selectedFont?.id === fontId
          ? { ...s.selectedFont, ...updates }
          : s.selectedFont,
    }));
  },
}));
