// ============================================================
// FontSpaceService — Fonte: FontSpace (scraping)
// Filtro dedicado para fontes de uso comercial.
// ============================================================
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import {
  Font,
  FontCategory,
  FontFilter,
  FontSource,
  PaginatedFonts,
} from "../../../shared/types";
import { BaseSourceService } from "./BaseSourceService";

const SOURCE: FontSource = "fontspace";

function parseCategory(text: string): FontCategory {
  const t = (text || "").toLowerCase();
  if (t.includes("serif") && !t.includes("sans")) return "serif";
  if (t.includes("sans")) return "sans-serif";
  if (t.includes("mono")) return "monospace";
  if (t.includes("script") || t.includes("hand")) return "handwriting";
  if (t.includes("display") || t.includes("deco")) return "display";
  return "other";
}

export class FontSpaceService extends BaseSourceService {
  protected readonly source = SOURCE;
  protected readonly CTX = "FontSpaceService";

  async fetchFonts(
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts> {
    try {
      const url = `https://www.fontspace.com/commercial-fonts?p=${page}`;
      const res = await this.http.get<string>(url, {
        headers: { Accept: "text/html" },
      });
      const $ = cheerio.load(res.data);
      const totalText = $("div.pager-container .text-light1").text();
      const totalMatch = totalText.match(/of\s+([\d,]+)\s+results/i);
      const total = totalMatch
        ? parseInt(totalMatch[1].replace(/,/g, ""), 10)
        : 0;
      const fonts = this.parseFonts(res.data);
      const filtered = this.applyClientFilter(fonts, filter);
      return {
        fonts: filtered.slice(0, pageSize),
        total: total || filtered.length,
        page,
        pageSize,
        hasMore: page * pageSize < (total || filtered.length),
      };
    } catch (err) {
      this.logError("Failed to fetch FontSpace fonts", err);
      return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }
  }

  async searchFonts(query: string, filter: FontFilter): Promise<Font[]> {
    try {
      const url = `https://www.fontspace.com/search?q=${encodeURIComponent(query)}&a=1`;
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

    $("div.font-container").each((_: number, el: AnyNode) => {
      const $el = $(el as AnyNode);
      const name = $el.find("a.font-name").first().text().trim();
      if (!name) return;

      const href = $el.find("a.font-name").first().attr("href") || "";
      const fullHref = href.startsWith("http")
        ? href
        : `https://www.fontspace.com${href}`;
      const slug =
        href.replace(/^\//, "") || name.toLowerCase().replace(/\s+/g, "-");

      const dlHref = $el.find("a[download]").first().attr("href") || "";
      const downloadUrl = dlHref
        ? dlHref.startsWith("http")
          ? dlHref
          : `https://www.fontspace.com${dlHref}`
        : fullHref;

      const previewImg = $el.find("a.font-image img").first().attr("src") || "";
      const designer = $el.find('a[rel="author"]').first().text().trim();
      const categoryText = $el.find('a[rel="category tag"]').first().text();

      fonts.push({
        id: `fontspace:${slug}`,
        name,
        family: name,
        category: parseCategory(categoryText),
        tags: ["commercial", "free"],
        variants: [{ weight: 400, style: "normal", url: "" }],
        source: SOURCE,
        sourceUrl: fullHref,
        license: "free-commercial",
        designer: designer || undefined,
        downloadUrl,
        previewImageUrl: previewImg || undefined,
        isInstalled: false,
        isFavorite: false,
      });
    });

    return fonts;
  }
}
