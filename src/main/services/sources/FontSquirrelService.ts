// ============================================================
// FontSquirrelService — Fonte: Font Squirrel (API JSON)
// Usa a API pública /api/fontlist/all em vez de scraping HTML,
// evitando bloqueios por bot-detection do Cloudflare.
// ============================================================
import {
  Font,
  FontCategory,
  FontFilter,
  FontSource,
  PaginatedFonts,
} from "../../../shared/types";
import { BaseSourceService } from "./BaseSourceService";

const SOURCE: FontSource = "font-squirrel";
const FS_API = "https://www.fontsquirrel.com/api/fontlist/all";

interface FSApiFont {
  id: string;
  family_name: string;
  family_urlname: string;
  foundry_name: string;
  font_filename: string;
  classification: string;
  family_count: string;
}

function mapCategory(classification: string): FontCategory {
  const c = (classification || "").toLowerCase();
  if (
    c.includes("script") ||
    c.includes("handdrawn") ||
    c.includes("calligraph")
  )
    return "handwriting";
  if (
    c.includes("mono") ||
    c.includes("typewriter") ||
    c.includes("programming")
  )
    return "monospace";
  if (c.includes("sans")) return "sans-serif";
  if (c.includes("slab") || c.includes("serif")) return "serif";
  // display, novelty, blackletter, retro, comic, pixel, dingbat, grunge, stencil…
  return "display";
}

export class FontSquirrelService extends BaseSourceService {
  protected readonly source = SOURCE;
  protected readonly CTX = "FontSquirrelService";

  /** Cache da lista completa — carregada uma vez por sessão */
  private cache: Font[] | null = null;

  private async loadAll(): Promise<Font[]> {
    if (this.cache) return this.cache;

    this.log("Carregando lista completa via API JSON...");
    const res = await this.http.get<FSApiFont[]>(FS_API);

    this.cache = res.data.map((f): Font => {
      const slug = f.family_urlname;
      return {
        id: `font-squirrel:${slug}`,
        name: f.family_name,
        family: f.family_name,
        category: mapCategory(f.classification),
        tags: ["commercial", "free", "open-source"],
        variants: [{ weight: 400, style: "normal" as const, url: "" }],
        source: SOURCE,
        sourceUrl: `https://www.fontsquirrel.com/fonts/${slug}`,
        license: "free-commercial",
        designer: f.foundry_name || undefined,
        downloadUrl: `https://www.fontsquirrel.com/fonts/download/${slug}`,
        // fontbrain.com gera preview com texto escuro em fundo claro.
        // O FontCard aplica filter: invert(1) para dark mode.
        previewImageUrl: `https://fontbrain.com/imgs/fonts/${slug}/fl-720-34-333333@2x.png`,
        isInstalled: false,
        isFavorite: false,
      };
    });

    this.log(`API retornou ${this.cache.length} fontes.`);
    return this.cache;
  }

  async fetchFonts(
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts> {
    try {
      const all = await this.loadAll();
      const filtered = this.applyClientFilter(all, filter);
      const start = (page - 1) * pageSize;
      return {
        fonts: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
        hasMore: start + pageSize < filtered.length,
      };
    } catch (err) {
      this.logError("Falha ao buscar fontes da Font Squirrel", err);
      return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }
  }

  async searchFonts(query: string, filter: FontFilter): Promise<Font[]> {
    try {
      const all = await this.loadAll();
      const q = query.toLowerCase().trim();
      const matched = q
        ? all.filter(
            (f) =>
              f.name.toLowerCase().includes(q) ||
              f.designer?.toLowerCase().includes(q),
          )
        : all;
      return this.applyClientFilter(matched, filter);
    } catch (err) {
      this.logError("Busca falhou", err);
      return [];
    }
  }
}
