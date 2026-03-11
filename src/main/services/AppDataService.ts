// ============================================================
// AppDataService — SOP: camada de persistência JSON centralizada
// Responsabilidade única: ler/gravar dados do usuário (favoritos,
// configurações, histórico de downloads).
// ============================================================
import { app } from "electron";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  DownloadTask,
  Font,
} from "../../shared/types";
import { logger } from "../utils/logger";

const CTX = "AppDataService";

interface AppData {
  settings: AppSettings;
  favorites: string[]; // Font IDs
  downloads: DownloadTask[];
  installedFonts: string[]; // Font IDs confirmed installed
  fontCache: Record<string, Font>; // id → Font (cache from remote sources)
  lastUpdated: string;
}

const DEFAULT_DATA: AppData = {
  settings: DEFAULT_SETTINGS,
  favorites: [],
  downloads: [],
  installedFonts: [],
  fontCache: {},
  lastUpdated: new Date().toISOString(),
};

export class AppDataService {
  private dataDir: string;
  private dataFile: string;
  private data: AppData = { ...DEFAULT_DATA };

  constructor() {
    this.dataDir = join(app.getPath("userData"), "freeckfonts");
    this.dataFile = join(this.dataDir, "data.json");
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------
  async initialize(): Promise<void> {
    logger.info(CTX, "Initializing data store", { path: this.dataFile });

    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }

    if (existsSync(this.dataFile)) {
      try {
        const raw = readFileSync(this.dataFile, "utf-8");
        const parsed = JSON.parse(raw) as Partial<AppData>;
        this.data = { ...DEFAULT_DATA, ...parsed };
        logger.info(CTX, "Data loaded successfully");
      } catch (err) {
        logger.error(CTX, "Failed to load data, using defaults", err);
        this.data = { ...DEFAULT_DATA };
      }
    } else {
      this.save();
      logger.info(CTX, "Created new data store");
    }
  }

  private save(): void {
    this.data.lastUpdated = new Date().toISOString();
    try {
      writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      logger.error(CTX, "Failed to save data", err);
    }
  }

  // -------------------------------------------------------
  // Settings
  // -------------------------------------------------------
  getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  saveSettings(settings: AppSettings): void {
    this.data.settings = { ...settings };
    this.save();
    logger.info(CTX, "Settings saved");
  }

  // -------------------------------------------------------
  // Favorites
  // -------------------------------------------------------
  getFavorites(): string[] {
    return [...this.data.favorites];
  }

  isFavorite(fontId: string): boolean {
    return this.data.favorites.includes(fontId);
  }

  toggleFavorite(fontId: string): boolean {
    const idx = this.data.favorites.indexOf(fontId);
    if (idx === -1) {
      this.data.favorites.push(fontId);
      this.save();
      return true; // now a favorite
    } else {
      this.data.favorites.splice(idx, 1);
      this.save();
      return false; // removed from favorites
    }
  }

  // -------------------------------------------------------
  // Download Tasks
  // -------------------------------------------------------
  getDownloads(): DownloadTask[] {
    return [...this.data.downloads];
  }

  upsertDownload(task: DownloadTask): void {
    const idx = this.data.downloads.findIndex((d) => d.id === task.id);
    if (idx === -1) {
      this.data.downloads.unshift(task);
    } else {
      this.data.downloads[idx] = task;
    }
    // Keep only last 50 completed downloads
    this.data.downloads = this.data.downloads.slice(0, 50);
    this.save();
  }

  removeDownload(id: string): void {
    this.data.downloads = this.data.downloads.filter((d) => d.id !== id);
    this.save();
  }

  clearCompletedDownloads(): void {
    this.data.downloads = this.data.downloads.filter(
      (d) =>
        d.status !== "completed" &&
        d.status !== "error" &&
        d.status !== "cancelled",
    );
    this.save();
  }

  // -------------------------------------------------------
  // Installed Fonts
  // -------------------------------------------------------
  getInstalledFontIds(): string[] {
    return [...this.data.installedFonts];
  }

  markAsInstalled(fontId: string): void {
    if (!this.data.installedFonts.includes(fontId)) {
      this.data.installedFonts.push(fontId);
      this.save();
    }
  }

  markAsUninstalled(fontId: string): void {
    this.data.installedFonts = this.data.installedFonts.filter(
      (id) => id !== fontId,
    );
    this.save();
  }

  isInstalled(fontId: string): boolean {
    return this.data.installedFonts.includes(fontId);
  }

  // -------------------------------------------------------
  // Font Cache (remote fonts indexed locally)
  // -------------------------------------------------------
  getCachedFont(id: string): Font | undefined {
    return this.data.fontCache[id];
  }

  cacheFont(font: Font): void {
    this.data.fontCache[font.id] = font;
    // Throttled save — don't save on every single font
  }

  cacheFonts(fonts: Font[]): void {
    for (const font of fonts) {
      this.data.fontCache[font.id] = font;
    }
    this.save();
  }

  getCachedFonts(): Font[] {
    return Object.values(this.data.fontCache);
  }

  clearFontCache(): void {
    this.data.fontCache = {};
    this.save();
  }

  // -------------------------------------------------------
  // Enrich fonts with user data (installed + favorite flags)
  // -------------------------------------------------------
  enrichFont(font: Font): Font {
    return {
      ...font,
      isInstalled: this.isInstalled(font.id),
      isFavorite: this.isFavorite(font.id),
    };
  }

  enrichFonts(fonts: Font[]): Font[] {
    return fonts.map((f) => this.enrichFont(f));
  }
}
