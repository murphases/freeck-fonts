// ============================================================
// GoogleFontsService — Fonte: Google Fonts (API oficial)
// Requer API Key configurada nas Settings.
// ============================================================
import {
  Font,
  FontCategory,
  FontFilter,
  FontSource,
  PaginatedFonts,
} from "../../../shared/types";
import { BaseSourceService } from "./BaseSourceService";

const SOURCE: FontSource = "google-fonts";

interface GFontItem {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  popularity?: number;
}

function mapCategory(cat: string): FontCategory {
  const map: Record<string, FontCategory> = {
    serif: "serif",
    "sans-serif": "sans-serif",
    monospace: "monospace",
    display: "display",
    handwriting: "handwriting",
  };
  return map[cat] || "other";
}

function parseWeight(variant: string): {
  weight: number;
  style: "normal" | "italic";
} {
  const isItalic = variant.includes("italic");
  const weightStr = variant.replace("italic", "").trim() || "400";
  const weight = weightStr === "regular" ? 400 : parseInt(weightStr, 10) || 400;
  return { weight, style: isItalic ? "italic" : "normal" };
}

export class GoogleFontsService extends BaseSourceService {
  protected readonly source = SOURCE;
  protected readonly CTX = "GoogleFontsService";

  private cache: Font[] | null = null;
  private cacheTime = 0;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 min

  async fetchFonts(
    page: number,
    pageSize: number,
    filter: FontFilter,
    apiKey?: string,
  ): Promise<PaginatedFonts> {
    if (!apiKey) {
      return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }

    try {
      const allFonts = await this.fetchAll(apiKey);
      const filtered = this.applyClientFilter(allFonts, filter);
      return this.paginate(filtered, page, pageSize);
    } catch (err) {
      this.logError("Failed to fetch Google Fonts", err);
      return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }
  }

  async searchFonts(
    query: string,
    filter: FontFilter,
    apiKey?: string,
  ): Promise<Font[]> {
    if (!apiKey) return [];

    const allFonts = await this.fetchAll(apiKey);
    return this.applyClientFilter(allFonts, { ...filter, search: query });
  }

  private async fetchAll(apiKey: string): Promise<Font[]> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.CACHE_TTL) {
      return this.cache;
    }

    this.log("Fetching all Google Fonts...");
    const res = await this.http.get<{ items: GFontItem[] }>(
      "https://www.googleapis.com/webfonts/v1/webfonts",
      { params: { key: apiKey, sort: "popularity" } },
    );

    const fonts: Font[] = res.data.items.map((item, idx) => {
      const id = `google-fonts:${item.family.toLowerCase().replace(/\s+/g, "-")}`;
      const variants = item.variants.map((v) => {
        const { weight, style } = parseWeight(v);
        const fileKey = v === "regular" ? "regular" : v;
        return {
          weight,
          style,
          url: (item.files[fileKey] || item.files["regular"] || "").replace(
            "http://",
            "https://",
          ),
          format: "ttf",
        };
      });

      return {
        id,
        name: item.family,
        family: item.family,
        category: mapCategory(item.category),
        tags: [item.category, ...item.subsets.slice(0, 3)],
        variants,
        source: SOURCE,
        sourceUrl: `https://fonts.google.com/specimen/${encodeURIComponent(item.family)}`,
        license: "ofl",
        licenseUrl: "https://openfontlicense.org",
        downloadUrl: `https://fonts.google.com/download?family=${encodeURIComponent(item.family)}`,
        isInstalled: false,
        isFavorite: false,
        subsets: item.subsets,
        popularity: Math.max(0, 100 - idx * 0.1),
      };
    });

    this.cache = fonts;
    this.cacheTime = now;
    this.log(`Cached ${fonts.length} Google Fonts`);
    return fonts;
  }

  invalidateCache(): void {
    this.cache = null;
  }
}
