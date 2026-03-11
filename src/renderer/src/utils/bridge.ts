// ============================================================
// bridge.ts — SOP: wrapper tipado para chamadas IPC
// Responsabilidade única: encapsular window.api com tipos seguros.
// ============================================================
import type {
  Font,
  FontFilter,
  FontSource,
  AppSettings,
  DownloadTask,
  ApiResponse,
  PaginatedFonts,
} from "@shared/types";

type Invoke<T> = Promise<ApiResponse<T>>;

export const bridge = {
  // -------------------------------------------------------
  // Fonts
  // -------------------------------------------------------
  fonts: {
    list: (
      source: FontSource,
      page: number,
      pageSize: number,
      filter: FontFilter,
    ): Invoke<PaginatedFonts> =>
      window.api.invoke("fonts:list", {
        source,
        page,
        pageSize,
        filter,
      }) as Invoke<PaginatedFonts>,

    listAll: (
      page: number,
      pageSize: number,
      filter: FontFilter,
    ): Invoke<PaginatedFonts> =>
      window.api.invoke("fonts:listAll", {
        page,
        pageSize,
        filter,
      }) as Invoke<PaginatedFonts>,

    search: (
      query: string,
      sources: FontSource[],
      filter: FontFilter,
    ): Invoke<Font[]> =>
      window.api.invoke("fonts:search", { query, sources, filter }) as Invoke<
        Font[]
      >,

    getInstalled: (): Invoke<Font[]> =>
      window.api.invoke("fonts:getInstalled") as Invoke<Font[]>,

    getFavorites: (): Invoke<Font[]> =>
      window.api.invoke("fonts:getFavorites") as Invoke<Font[]>,

    toggleFavorite: (fontId: string): Invoke<{ isFavorite: boolean }> =>
      window.api.invoke("fonts:toggleFavorite", fontId) as Invoke<{
        isFavorite: boolean;
      }>,

    download: (font: Font): Invoke<DownloadTask> =>
      window.api.invoke("fonts:download", font) as Invoke<DownloadTask>,

    uninstall: (fontId: string, fontName: string): Invoke<void> =>
      window.api.invoke("fonts:uninstall", {
        fontId,
        fontName,
      }) as Invoke<void>,

    details: (fontId: string): Invoke<Font | null> =>
      window.api.invoke("fonts:details", fontId) as Invoke<Font | null>,
  },

  // -------------------------------------------------------
  // Downloads
  // -------------------------------------------------------
  downloads: {
    getAll: (): Invoke<DownloadTask[]> =>
      window.api.invoke("downloads:getAll") as Invoke<DownloadTask[]>,

    cancel: (downloadId: string): Invoke<void> =>
      window.api.invoke("downloads:cancel", downloadId) as Invoke<void>,

    clear: (): Invoke<void> =>
      window.api.invoke("downloads:clear") as Invoke<void>,
  },

  // -------------------------------------------------------
  // Settings
  // -------------------------------------------------------
  settings: {
    get: (): Invoke<AppSettings> =>
      window.api.invoke("settings:get") as Invoke<AppSettings>,

    save: (settings: AppSettings): Invoke<void> =>
      window.api.invoke("settings:save", settings) as Invoke<void>,
  },

  // -------------------------------------------------------
  // System
  // -------------------------------------------------------
  system: {
    getPlatform: (): Invoke<string> =>
      window.api.invoke("system:getPlatform") as Invoke<string>,

    getFontsDir: (): Invoke<string> =>
      window.api.invoke("system:getFontsDir") as Invoke<string>,

    openPath: (path: string): Invoke<void> =>
      window.api.invoke("system:openPath", path) as Invoke<void>,
  },

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------
  update: {
    download: (): Invoke<void> =>
      window.api.invoke("update:download") as Invoke<void>,

    install: (): Invoke<void> =>
      window.api.invoke("update:install") as Invoke<void>,
  },

  // -------------------------------------------------------
  // Events (main → renderer)
  // -------------------------------------------------------
  events: {
    onDownloadProgress: (cb: (task: DownloadTask) => void): (() => void) =>
      window.api.on(
        "evt:download:progress",
        cb as (...args: unknown[]) => void,
      ),

    onDownloadComplete: (cb: (task: DownloadTask) => void): (() => void) =>
      window.api.on(
        "evt:download:complete",
        cb as (...args: unknown[]) => void,
      ),

    onDownloadError: (cb: (task: DownloadTask) => void): (() => void) =>
      window.api.on("evt:download:error", cb as (...args: unknown[]) => void),

    onFontInstalled: (cb: (data: { fontId: string }) => void): (() => void) =>
      window.api.on("evt:font:installed", cb as (...args: unknown[]) => void),
  },
};
