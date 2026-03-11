// ============================================================
// FontLibraryService — Fonte: Font Library (scraping)
// Fontes open-source com licenças comercialmente compatíveis.
// ============================================================
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import {
  Font,
  FontFilter,
  FontSource,
  PaginatedFonts,
} from "../../../shared/types";
import { BaseSourceService } from "./BaseSourceService";

const SOURCE: FontSource = "font-library";

export class FontLibraryService extends BaseSourceService {
  protected readonly source = SOURCE;
  protected readonly CTX = "FontLibraryService";

  async fetchFonts(
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts> {
    try {
      const url = `https://fontlibrary.org/en/search?license=${encodeURIComponent("OFL (SIL Open Font License)")}&order=pop&page=${page}`;
      const res = await this.http.get<string>(url, {
        headers: { Accept: "text/html" },
      });
      const $ = cheerio.load(res.data);
      const hasMore = $("a#next_button").length > 0;
      const fonts = this.parseFonts(res.data);
      const filtered = this.applyClientFilter(fonts, filter);
      return {
        fonts: filtered.slice(0, pageSize),
        total: filtered.length + (hasMore ? pageSize : 0),
        page,
        pageSize,
        hasMore,
      };
    } catch (err) {
      this.logError("Failed to fetch Font Library fonts", err);
      return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }
  }

  async searchFonts(query: string, filter: FontFilter): Promise<Font[]> {
    try {
      const url = `https://fontlibrary.org/en/search?query=${encodeURIComponent(query)}&order=pop`;
      const res = await this.http.get<string>(url, {
        headers: { Accept: "text/html" },
      });
      return this.applyClientFilter(this.parseFonts(res.data), filter);
    } catch (err) {
      this.logError("Search failed", err);
      return [];
    }
  }

  private parseFonts(html: string): Font[] {
    const $ = cheerio.load(html);
    const fonts: Font[] = [];

    $("div#results div.element").each((_: number, el: AnyNode) => {
      const $el = $(el as AnyNode);
      const nameEl = $el.find("li.family-name a").first();
      const name = nameEl.text().trim();
      if (!name) return;

      const href = nameEl.attr("href") || "";
      const fullHref = href.startsWith("http")
        ? href
        : `https://fontlibrary.org${href}`;
      const slug =
        href.split("/").filter(Boolean).pop() ||
        name.toLowerCase().replace(/\s+/g, "-");

      const rawLibImg = $el.find("img.font-preview").first().attr("src") || "";
      // Converter URLs relativas de protocolo (//...) ou relativas (/...) para absolutas
      const previewImg = rawLibImg.startsWith("//")
        ? `https:${rawLibImg}`
        : rawLibImg.startsWith("/")
          ? `https://fontlibrary.org${rawLibImg}`
          : rawLibImg;
      const designer = $el
        .find("li.designer span.byline")
        .first()
        .text()
        .trim();

      fonts.push({
        id: `font-library:${slug}`,
        name,
        family: name,
        category: "other",
        tags: ["commercial", "free", "open-source"],
        variants: [{ weight: 400, style: "normal" as const, url: "" }],
        source: SOURCE,
        sourceUrl: fullHref,
        license: "ofl",
        licenseUrl: "https://openfontlicense.org",
        designer: designer || undefined,
        downloadUrl: fullHref,
        previewImageUrl: previewImg || undefined,
        isInstalled: false,
        isFavorite: false,
      });
    });

    return fonts;
  }
}
