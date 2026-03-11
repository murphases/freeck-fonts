// ============================================================
// FreeckFonts — Shared Types (SOP: Contrato central de dados)
// ============================================================

export type FontCategory =
  | "serif"
  | "sans-serif"
  | "monospace"
  | "display"
  | "handwriting"
  | "other";

export type FontSource =
  | "google-fonts"
  | "font-squirrel"
  | "fontspace"
  | "1001-fonts"
  | "font-library"
  | "open-foundry"
  | "local";

export type FontLicense =
  | "ofl" // SIL Open Font License
  | "apache" // Apache License
  | "mit" // MIT License
  | "cc-by" // Creative Commons Attribution
  | "public-domain"
  | "free-commercial"
  | "custom"
  | "unknown";

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "extracting"
  | "installing"
  | "completed"
  | "error"
  | "cancelled";

// -------------------------------------------------------
// Font Model
// -------------------------------------------------------
export interface FontVariant {
  weight: number; // 100–900
  style: "normal" | "italic";
  url: string; // URL for this variant's file
  format?: string; // 'ttf' | 'otf' | 'woff2' | 'woff'
}

export interface Font {
  id: string;
  name: string;
  family: string;
  category: FontCategory;
  tags: string[];
  variants: FontVariant[];
  source: FontSource;
  sourceUrl: string; // URL on the origin website
  license: FontLicense;
  licenseUrl?: string;
  designer?: string;
  foundry?: string;
  description?: string;
  downloadUrl: string; // URL to download the full font package (.zip)
  previewImageUrl?: string; // Static preview image from source
  isInstalled: boolean;
  isFavorite: boolean;
  localPath?: string; // Local dir path after download
  downloadedAt?: string;
  installedAt?: string;
  popularity?: number; // 0–100
  subsets?: string[]; // latin, cyrillic, etc.
}

// -------------------------------------------------------
// Filter & Search
// -------------------------------------------------------
export interface FontFilter {
  sources?: FontSource[];
  categories?: FontCategory[];
  licenses?: FontLicense[];
  search?: string;
  showInstalled?: boolean;
  showFavorites?: boolean;
  sortBy?: "name" | "popularity" | "newest";
  sortOrder?: "asc" | "desc";
}

// -------------------------------------------------------
// Download Task
// -------------------------------------------------------
export interface DownloadTask {
  id: string;
  fontId: string;
  fontName: string;
  source: FontSource;
  downloadUrl: string;
  progress: number; // 0–100
  status: DownloadStatus;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// -------------------------------------------------------
// App Settings
// -------------------------------------------------------
export interface AppSettings {
  googleFontsApiKey: string;
  previewText: string;
  previewSize: number; // px
  theme: "light" | "dark" | "system";
  fontInstallMode: "user" | "system";
  downloadPath: string;
  language: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  googleFontsApiKey: "",
  previewText: "The quick brown fox jumps over the lazy dog",
  previewSize: 32,
  theme: "dark",
  fontInstallMode: "user",
  downloadPath: "",
  // String vazia = primeiro uso → exibe onboarding de seleção de idioma
  language: "",
};

// -------------------------------------------------------
// API Response Wrappers
// -------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

export interface PaginatedFonts {
  fonts: Font[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// -------------------------------------------------------
// IPC Channel Registry (SOP: canal único e tipado)
// -------------------------------------------------------
export const IPC = {
  FONTS_LIST: "fonts:list",
  FONTS_LIST_ALL: "fonts:listAll",
  FONTS_SEARCH: "fonts:search",
  FONTS_DETAILS: "fonts:details",
  FONTS_DOWNLOAD: "fonts:download",
  FONTS_INSTALL: "fonts:install",
  FONTS_UNINSTALL: "fonts:uninstall",
  FONTS_GET_INSTALLED: "fonts:getInstalled",
  FONTS_GET_FAVORITES: "fonts:getFavorites",
  FONTS_TOGGLE_FAVORITE: "fonts:toggleFavorite",
  FONTS_OPEN_FOLDER: "fonts:openFolder",

  DOWNLOADS_GET_ALL: "downloads:getAll",
  DOWNLOADS_CANCEL: "downloads:cancel",
  DOWNLOADS_CLEAR: "downloads:clear",

  SETTINGS_GET: "settings:get",
  SETTINGS_SAVE: "settings:save",

  SYSTEM_OPEN_PATH: "system:openPath",
  SYSTEM_GET_PLATFORM: "system:getPlatform",
  SYSTEM_GET_FONTS_DIR: "system:getFontsDir",

  // Events pushed from main → renderer
  EVT_DOWNLOAD_PROGRESS: "evt:download:progress",
  EVT_DOWNLOAD_COMPLETE: "evt:download:complete",
  EVT_DOWNLOAD_ERROR: "evt:download:error",
  EVT_FONT_INSTALLED: "evt:font:installed",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

// -------------------------------------------------------
// Source Metadata (for UI display)
// -------------------------------------------------------
export interface SourceInfo {
  id: FontSource;
  label: string;
  description: string;
  url: string;
  color: string;
  requiresApiKey?: boolean;
}

export const FONT_SOURCES: SourceInfo[] = [
  {
    id: "google-fonts",
    label: "Google Fonts",
    description: "Biblioteca open-source para uso comercial e web",
    url: "https://fonts.google.com",
    color: "#4285F4",
    requiresApiKey: true,
  },
  {
    id: "font-squirrel",
    label: "Font Squirrel",
    description: "Curadoria rigorosa de fontes gratuitas para uso comercial",
    url: "https://www.fontsquirrel.com",
    color: "#6ab04c",
  },
  {
    id: "fontspace",
    label: "FontSpace",
    description: "Filtro dedicado para fontes de uso comercial",
    url: "https://www.fontspace.com",
    color: "#e84393",
  },
  {
    id: "1001-fonts",
    label: "1001 Fonts",
    description: "Busca exclusiva de fontes gratuitas para uso comercial",
    url: "https://www.1001fonts.com",
    color: "#f0a500",
  },
  {
    id: "font-library",
    label: "Font Library",
    description: "Promoção de fontes open-source (OFL)",
    url: "https://fontlibrary.org",
    color: "#00bcd4",
  },
  {
    id: "open-foundry",
    label: "Open Foundry",
    description: "Plataforma exclusiva para fontes open-source",
    url: "https://open-foundry.com",
    color: "#ff6b35",
  },
];
