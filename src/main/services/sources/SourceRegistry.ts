// ============================================================
// SourceRegistry — SOP: ponto único de acesso a todas as fontes
// Responsabilidade: orquestrar chamadas para os serviços de fontes
// e agregar resultados com dados do usuário (favoritos, instalados).
// ============================================================
import {
  Font,
  FontFilter,
  FontSource,
  PaginatedFonts,
} from "../../../shared/types";
import { AppDataService } from "../AppDataService";
import { GoogleFontsService } from "./GoogleFontsService";
import { FontSquirrelService } from "./FontSquirrelService";
import { FontLibraryService } from "./FontLibraryService";
import { OpenFoundryService } from "./OpenFoundryService";
import { FontSpaceService } from "./FontSpaceService";
import { Fonts1001Service } from "./Fonts1001Service";
import { logger } from "../../utils/logger";

const CTX = "SourceRegistry";

export class SourceRegistry {
  private readonly googleFonts = new GoogleFontsService();
  private readonly fontSquirrel = new FontSquirrelService();
  private readonly fontLibrary = new FontLibraryService();
  private readonly openFoundry = new OpenFoundryService();
  private readonly fontSpace = new FontSpaceService();
  private readonly fonts1001 = new Fonts1001Service();

  constructor(private readonly dataService: AppDataService) {}

  // -------------------------------------------------------
  // Fetch from a single source
  // -------------------------------------------------------
  async fetchFromSource(
    source: FontSource,
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts> {
    const apiKey = this.dataService.getSettings().googleFontsApiKey;

    let result: PaginatedFonts;

    switch (source) {
      case "google-fonts":
        result = await this.googleFonts.fetchFonts(
          page,
          pageSize,
          filter,
          apiKey,
        );
        break;
      case "font-squirrel":
        result = await this.fontSquirrel.fetchFonts(page, pageSize, filter);
        break;
      case "font-library":
        result = await this.fontLibrary.fetchFonts(page, pageSize, filter);
        break;
      case "open-foundry":
        result = await this.openFoundry.fetchFonts(page, pageSize, filter);
        break;
      case "fontspace":
        result = await this.fontSpace.fetchFonts(page, pageSize, filter);
        break;
      case "1001-fonts":
        result = await this.fonts1001.fetchFonts(page, pageSize, filter);
        break;
      default:
        return { fonts: [], total: 0, page, pageSize, hasMore: false };
    }

    result.fonts = this.dataService.enrichFonts(result.fonts);
    this.dataService.cacheFonts(result.fonts);
    return result;
  }

  // -------------------------------------------------------
  // Search across multiple sources
  // -------------------------------------------------------
  async searchAcrossSources(
    query: string,
    sources: FontSource[],
    filter: FontFilter,
  ): Promise<Font[]> {
    const apiKey = this.dataService.getSettings().googleFontsApiKey;
    const activeFilter = { ...filter, search: query };

    const promises = sources.map(async (source): Promise<Font[]> => {
      try {
        switch (source) {
          case "google-fonts":
            return await this.googleFonts.searchFonts(
              query,
              activeFilter,
              apiKey,
            );
          case "font-squirrel":
            return await this.fontSquirrel.searchFonts(query, activeFilter);
          case "font-library":
            return await this.fontLibrary.searchFonts(query, activeFilter);
          case "open-foundry":
            return await this.openFoundry.searchFonts(query, activeFilter);
          case "fontspace":
            return await this.fontSpace.searchFonts(query, activeFilter);
          case "1001-fonts":
            return await this.fonts1001.searchFonts(query, activeFilter);
          default:
            return [];
        }
      } catch (err) {
        logger.warn(CTX, `Search failed for source ${source}`, err);
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    const fonts = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : [],
    );

    const enriched = this.dataService.enrichFonts(fonts);
    this.dataService.cacheFonts(enriched);
    return enriched;
  }

  // -------------------------------------------------------
  // Fetch all enabled sources in parallel (browse mode)
  // -------------------------------------------------------
  async fetchAllSources(
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts> {
    const sources = filter.sources?.length
      ? filter.sources
      : ([
          "google-fonts",
          "font-squirrel",
          "font-library",
          "open-foundry",
          "fontspace",
          "1001-fonts",
        ] as FontSource[]);

    const empty: PaginatedFonts = {
      fonts: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
    const promises = sources.map((s) =>
      this.fetchFromSource(s, page, pageSize, filter).catch((err) => {
        logger.warn(CTX, `fetchAllSources: ${s} failed`, err);
        return empty;
      }),
    );

    const results = await Promise.all(promises);

    const allFonts: Font[] = [];
    let total = 0;
    let hasMore = false;

    for (const r of results) {
      allFonts.push(...r.fonts);
      total += r.total;
      if (r.hasMore) hasMore = true;
    }

    return { fonts: allFonts, total, page, pageSize, hasMore };
  }

  // -------------------------------------------------------
  // Get a specific font by ID (from cache or live)
  // -------------------------------------------------------
  getFromCache(fontId: string): Font | undefined {
    const cached = this.dataService.getCachedFont(fontId);
    if (cached) return this.dataService.enrichFont(cached);
    return undefined;
  }
}
