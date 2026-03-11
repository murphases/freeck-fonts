// ============================================================
// fontHandlers — SOP: handlers IPC para operações de fontes
// ============================================================
import { IpcMain } from "electron";
import { IPC, FontFilter, FontSource } from "@shared/types";
import { AppDataService } from "../services/AppDataService";
import { FontManagerService } from "../services/FontManagerService";
import { SourceRegistry } from "../services/sources/SourceRegistry";
import { logger } from "../utils/logger";

const CTX = "fontHandlers";

export function registerFontHandlers(
  ipcMain: IpcMain,
  dataService: AppDataService,
  fontManager: FontManagerService,
  registry: SourceRegistry,
): void {
  // -------------------------------------------------------
  // List fonts from a source (paginated)
  // -------------------------------------------------------
  ipcMain.handle(
    IPC.FONTS_LIST,
    async (
      _event,
      args: {
        source: FontSource;
        page: number;
        pageSize: number;
        filter: FontFilter;
      },
    ) => {
      try {
        logger.debug(CTX, "fonts:list", args);
        const result = await registry.fetchFromSource(
          args.source,
          args.page || 1,
          args.pageSize || 24,
          args.filter || {},
        );
        return { success: true, data: result };
      } catch (err) {
        logger.error(CTX, "fonts:list failed", err);
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // -------------------------------------------------------
  // List fonts from ALL sources (paginated, parallel)
  // -------------------------------------------------------
  ipcMain.handle(
    IPC.FONTS_LIST_ALL,
    async (
      _event,
      args: { page: number; pageSize: number; filter: FontFilter },
    ) => {
      try {
        logger.debug(CTX, "fonts:listAll", args);
        const result = await registry.fetchAllSources(
          args.page || 1,
          args.pageSize || 24,
          args.filter || {},
        );
        return { success: true, data: result };
      } catch (err) {
        logger.error(CTX, "fonts:listAll failed", err);
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // -------------------------------------------------------
  // Search fonts across sources
  // -------------------------------------------------------
  ipcMain.handle(
    IPC.FONTS_SEARCH,
    async (
      _event,
      args: {
        query: string;
        sources: FontSource[];
        filter: FontFilter;
      },
    ) => {
      try {
        logger.debug(CTX, "fonts:search", { query: args.query });
        const fonts = await registry.searchAcrossSources(
          args.query,
          args.sources?.length
            ? args.sources
            : ["google-fonts", "font-squirrel", "font-library"],
          args.filter || {},
        );
        return { success: true, data: fonts };
      } catch (err) {
        logger.error(CTX, "fonts:search failed", err);
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // -------------------------------------------------------
  // Get installed (system) fonts
  // -------------------------------------------------------
  ipcMain.handle(IPC.FONTS_GET_INSTALLED, async () => {
    try {
      const fonts = await fontManager.scanSystemFonts();
      return { success: true, data: fonts };
    } catch (err) {
      logger.error(CTX, "fonts:getInstalled failed", err);
      return { success: false, error: (err as Error).message };
    }
  });

  // -------------------------------------------------------
  // Get favorites
  // -------------------------------------------------------
  ipcMain.handle(IPC.FONTS_GET_FAVORITES, () => {
    try {
      const favoriteIds = dataService.getFavorites();
      const fonts = dataService
        .getCachedFonts()
        .filter((f) => favoriteIds.includes(f.id))
        .map((f) => dataService.enrichFont(f));
      return { success: true, data: fonts };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // -------------------------------------------------------
  // Toggle favorite
  // -------------------------------------------------------
  ipcMain.handle(IPC.FONTS_TOGGLE_FAVORITE, (_event, fontId: string) => {
    try {
      const isFavorite = dataService.toggleFavorite(fontId);
      return { success: true, data: { isFavorite } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // -------------------------------------------------------
  // Uninstall font
  // -------------------------------------------------------
  ipcMain.handle(
    IPC.FONTS_UNINSTALL,
    async (_event, args: { fontId: string; fontName: string }) => {
      try {
        await fontManager.uninstallFont(args.fontId, args.fontName);
        return { success: true };
      } catch (err) {
        logger.error(CTX, "fonts:uninstall failed", err);
        return { success: false, error: (err as Error).message };
      }
    },
  );

  // -------------------------------------------------------
  // Get font details from cache
  // -------------------------------------------------------
  ipcMain.handle(IPC.FONTS_DETAILS, (_event, fontId: string) => {
    const font = registry.getFromCache(fontId);
    return { success: true, data: font || null };
  });
}
