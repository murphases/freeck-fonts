// ============================================================
// systemHandlers — SOP: handlers IPC para operações do sistema
// ============================================================
import { IpcMain, shell } from "electron";
import { IPC } from "@shared/types";
import {
  getPlatform,
  getUserFontDir,
  openPathInExplorer,
} from "../utils/platformUtils";
import { logger } from "../utils/logger";

export function registerSystemHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC.SYSTEM_GET_PLATFORM, () => {
    return { success: true, data: getPlatform() };
  });

  ipcMain.handle(IPC.SYSTEM_GET_FONTS_DIR, () => {
    return { success: true, data: getUserFontDir() };
  });

  ipcMain.handle(IPC.SYSTEM_OPEN_PATH, async (_event, path: string) => {
    try {
      await shell.openPath(path);
      return { success: true };
    } catch (err) {
      logger.error("systemHandlers", "Failed to open path", err);
      return { success: false, error: (err as Error).message };
    }
  });
}
