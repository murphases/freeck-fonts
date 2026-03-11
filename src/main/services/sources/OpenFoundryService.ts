// ============================================================
// OpenFoundryService — Fonte: Open Foundry (scraping)
// Plataforma exclusiva de fontes open-source de alta qualidade.
// ============================================================
import * as cheerio from "cheerio";
import {
  Font,
  FontFilter,
  FontSource,
  PaginatedFonts,
} from "../../../shared/types";
import { BaseSourceService } from "./BaseSourceService";

const SOURCE: FontSource = "open-foundry";

export class OpenFoundryService extends BaseSourceService {
  protected readonly source = SOURCE;
  protected readonly CTX = "OpenFoundryService";

  private cache: Font[] | null = null;
  private cacheTime = 0;
  private readonly CACHE_TTL = 60 * 60 * 1000;

  async fetchFonts(
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts> {
    try {
      const all = await this.fetchAll();
      const filtered = this.applyClientFilter(all, filter);
      return this.paginate(filtered, page, pageSize);
    } catch (err) {
      this.logError("Failed to fetch Open Foundry fonts", err);
      return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }
  }

  async searchFonts(query: string, filter: FontFilter): Promise<Font[]> {
    const all = await this.fetchAll();
    return this.applyClientFilter(all, { ...filter, search: query });
  }

  private async fetchAll(): Promise<Font[]> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.CACHE_TTL) return this.cache;

    this.log("Scraping Open Foundry...");
    const res = await this.http.get<string>("https://open-foundry.com/fonts", {
      headers: { Accept: "text/html" },
    });

    const $ = cheerio.load(res.data);
    const fonts: Font[] = [];

    // Open Foundry uses CSS classes for font cards
    $(".font-list-item, .font-card, article.font, .font").each(
      (_: unknown, el: unknown) => {
        const $el = $(el);
        const name =
          $el.find(".font-name, h2, h3, .name").first().text().trim() ||
          $el.attr("data-name") ||
          "";
        if (!name) return;

        const href =
          $el.find("a").first().attr("href") || $el.attr("data-href") || "";
        const fullHref = href.startsWith("http")
          ? href
          : `https://open-foundry.com${href}`;
        const slug =
          href.split("/").filter(Boolean).pop() ||
          name.toLowerCase().replace(/\s+/g, "-");

        fonts.push({
          id: `open-foundry:${slug}`,
          name,
          family: name,
          category: "other",
          tags: ["open-source", "ofl"],
          variants: [{ weight: 400, style: "normal", url: "" }],
          source: SOURCE,
          sourceUrl: fullHref,
          license: "ofl",
          licenseUrl: "https://openfontlicense.org",
          downloadUrl: fullHref,
          isInstalled: false,
          isFavorite: false,
        });
      },
    );

    // Fallback: if scraping fails to find fonts, return curated list
    if (fonts.length === 0) {
      return this.getCuratedList();
    }

    this.cache = fonts;
    this.cacheTime = now;
    this.log(`Found ${fonts.length} Open Foundry fonts`);
    return fonts;
  }

  private getCuratedList(): Font[] {
    const curated = [
      { name: "Noto Sans", slug: "noto-sans", category: "sans-serif" as const },
      { name: "Inter", slug: "inter", category: "sans-serif" as const },
      {
        name: "Playfair Display",
        slug: "playfair-display",
        category: "serif" as const,
      },
      {
        name: "JetBrains Mono",
        slug: "jetbrains-mono",
        category: "monospace" as const,
      },
      {
        name: "Source Serif Pro",
        slug: "source-serif-pro",
        category: "serif" as const,
      },
      {
        name: "IBM Plex Sans",
        slug: "ibm-plex-sans",
        category: "sans-serif" as const,
      },
      {
        name: "Libre Baskerville",
        slug: "libre-baskerville",
        category: "serif" as const,
      },
      {
        name: "Space Grotesk",
        slug: "space-grotesk",
        category: "sans-serif" as const,
      },
    ];

    return curated.map((f) => ({
      id: `open-foundry:${f.slug}`,
      name: f.name,
      family: f.name,
      category: f.category,
      tags: ["open-source", "ofl"],
      variants: [{ weight: 400, style: "normal" as const, url: "" }],
      source: SOURCE,
      sourceUrl: `https://open-foundry.com/fonts/${f.slug}`,
      license: "ofl" as const,
      licenseUrl: "https://openfontlicense.org",
      downloadUrl: `https://open-foundry.com/fonts/${f.slug}`,
      isInstalled: false,
      isFavorite: false,
    }));
  }
}
