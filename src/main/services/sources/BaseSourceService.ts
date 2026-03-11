// ============================================================
// BaseSourceService — SOP: contrato base para todos os serviços
// de fontes. Define interface e helpers compartilhados.
// ============================================================
import axios, { AxiosInstance } from "axios";
import {
  Font,
  FontSource,
  PaginatedFonts,
  FontFilter,
} from "../../../shared/types";
import { logger } from "../../utils/logger";

export abstract class BaseSourceService {
  protected readonly http: AxiosInstance;
  protected abstract readonly source: FontSource;
  protected abstract readonly CTX: string;

  constructor() {
    this.http = axios.create({
      timeout: 20_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  }

  // -------------------------------------------------------
  // Abstract: must be implemented by each source
  // -------------------------------------------------------
  abstract fetchFonts(
    page: number,
    pageSize: number,
    filter: FontFilter,
  ): Promise<PaginatedFonts>;
  abstract searchFonts(query: string, filter: FontFilter): Promise<Font[]>;

  // -------------------------------------------------------
  // Optional: get font details
  // -------------------------------------------------------
  async getFontDetails(_fontId: string): Promise<Font | null> {
    return null;
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  protected log(message: string, data?: unknown): void {
    logger.info(this.CTX, message, data);
  }

  protected logError(message: string, data?: unknown): void {
    logger.error(this.CTX, message, data);
  }

  protected logWarn(message: string, data?: unknown): void {
    logger.warn(this.CTX, message, data);
  }

  protected applyClientFilter(fonts: Font[], filter: FontFilter): Font[] {
    let result = [...fonts];

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.family.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (filter.categories?.length) {
      result = result.filter((f) => filter.categories!.includes(f.category));
    }

    if (filter.licenses?.length) {
      result = result.filter((f) => filter.licenses!.includes(f.license));
    }

    if (filter.sortBy === "name") {
      result.sort((a, b) =>
        filter.sortOrder === "desc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name),
      );
    } else if (filter.sortBy === "popularity") {
      result.sort((a, b) =>
        filter.sortOrder === "asc"
          ? (a.popularity || 0) - (b.popularity || 0)
          : (b.popularity || 0) - (a.popularity || 0),
      );
    }

    return result;
  }

  protected paginate(
    fonts: Font[],
    page: number,
    pageSize: number,
  ): PaginatedFonts {
    const start = (page - 1) * pageSize;
    const items = fonts.slice(start, start + pageSize);
    return {
      fonts: items,
      total: fonts.length,
      page,
      pageSize,
      hasMore: start + pageSize < fonts.length,
    };
  }
}
