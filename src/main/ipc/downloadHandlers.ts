// ============================================================
// downloadHandlers — SOP: handlers IPC para downloads
// ============================================================
import { IpcMain, BrowserWindow } from "electron";
import { IPC, Font } from "@shared/types";
import { AppDataService } from "../services/AppDataService";
import { DownloadService } from "../services/DownloadService";
import { logger } from "../utils/logger";

const CTX = "downloadHandlers";

export function registerDownloadHandlers(
  ipcMain: IpcMain,
  downloadService: DownloadService,
  dataService: AppDataService,
): void {
  // -------------------------------------------------------
  // Start download + install
  // -------------------------------------------------------
  ipcMain.handle(IPC.FONTS_DOWNLOAD, async (_event, font: Font) => {
    try {
      logger.info(CTX, `Starting download: ${font.name}`);
      const task = await downloadService.startDownload(font);
      return { success: true, data: task };
    } catch (err) {
      logger.error(CTX, "fonts:download failed", err);
      return { success: false, error: (err as Error).message };
    }
  });

  // -------------------------------------------------------
  // Get all download tasks
  // -------------------------------------------------------
  ipcMain.handle(IPC.DOWNLOADS_GET_ALL, () => {
    return { success: true, data: dataService.getDownloads() };
  });

  // -------------------------------------------------------
  // Cancel a download
  // -------------------------------------------------------
  ipcMain.handle(IPC.DOWNLOADS_CANCEL, (_event, downloadId: string) => {
    downloadService.cancel(downloadId);
    return { success: true };
  });

  // -------------------------------------------------------
  // Clear completed/errored downloads
  // -------------------------------------------------------
  ipcMain.handle(IPC.DOWNLOADS_CLEAR, () => {
    dataService.clearCompletedDownloads();
    return { success: true };
  });
}
