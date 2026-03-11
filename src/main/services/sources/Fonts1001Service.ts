// ============================================================
// Fonts1001Service — Fonte: 1001 Fonts (scraping)
// Busca exclusiva de fontes gratuitas para uso comercial.
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

const SOURCE: FontSource = "1001-fonts";

function parseCategory(text: string): FontCategory {
  const t = (text || "").toLowerCase();
  if (t.includes("serif") && !t.includes("sans")) return "serif";
  if (t.includes("sans")) return "sans-serif";
  if (t.includes("mono")) return "monospace";
  if (
    t.includes("script") ||
    t.includes("handwritten") ||
    t.includes("calligraphy")
  )
    return "handwriting";
  return "other";
}

export class Fonts1001Service extends BaseSourceService {
  protected readonly source = SOURCE;
  protected readonly CTX = "Fonts1001Service";

  async fetchFonts(
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts> {
    try {
      const url = `https://www.1001fonts.com/free-for-commercial-use-fonts.html?page=${page}`;
      const res = await this.http.get<string>(url, {
        headers: { Accept: "text/html" },
      });
      const $ = cheerio.load(res.data);
      const total = parseInt(
        $("section#browsing-results").attr("data-total-items") || "0",
        10,
      );
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
      this.logError("Failed to fetch 1001 Fonts", err);
      return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }
  }

  async searchFonts(query: string, filter: FontFilter): Promise<Font[]> {
    try {
      const url = `https://www.1001fonts.com/search.html?search=${encodeURIComponent(query)}&page=1`;
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

    $("li.font-list-item").each((_: number, el: AnyNode) => {
      const $el = $(el as AnyNode);

      // Nome: texto direto do span.font-title (ignora elementos filhos)
      const $title = $el.find("span.font-title").first();
      const name = $title.clone().children().remove().end().text().trim();
      if (!name) return;

      // Link da página e slug: a.preview-link → /laraz-font.html
      const pageHref = $el.find("a.preview-link").attr("href") || "";
      const fullHref = pageHref.startsWith("http")
        ? pageHref
        : `https://www.1001fonts.com${pageHref}`;
      const slug =
        pageHref.replace(/^\//, "").replace(/-font\.html$/, "") ||
        name.toLowerCase().replace(/\s+/g, "-");

      // Download: a.btn-download → /download/laraz.zip
      const dlHref = $el.find("a.btn-download").attr("href") || "";
      const downloadUrl = dlHref
        ? dlHref.startsWith("http")
          ? dlHref
          : `https://www.1001fonts.com${dlHref}`
        : `https://www.1001fonts.com/download/${slug}.zip`;

      // Preview: picture.txt-preview img — pode usar lazy-loading com data-src
      const previewImgEl = $el.find("picture.txt-preview img").first();
      const rawPreviewImg =
        previewImgEl.attr("src") ||
        previewImgEl.attr("data-src") ||
        previewImgEl.attr("data-lazy-src") ||
        (previewImgEl.attr("srcset") || "").split(" ")[0] ||
        "";
      // Garantir URL absoluta
      const previewImg = rawPreviewImg.startsWith("http")
        ? rawPreviewImg
        : rawPreviewImg
          ? `https://www.1001fonts.com${rawPreviewImg}`
          : "";

      // Designer
      const designer = $el.find('a[rel="author"]').first().text().trim();

      fonts.push({
        id: `1001-fonts:${slug}`,
        name,
        family: name,
        category: "other",
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
