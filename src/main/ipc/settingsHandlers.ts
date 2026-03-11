// ============================================================
// settingsHandlers — SOP: handlers IPC para configurações
// ============================================================
import { IpcMain } from "electron";
import { IPC, AppSettings } from "@shared/types";
import { AppDataService } from "../services/AppDataService";

export function registerSettingsHandlers(
  ipcMain: IpcMain,
  dataService: AppDataService,
): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return { success: true, data: dataService.getSettings() };
  });

  ipcMain.handle(IPC.SETTINGS_SAVE, (_event, settings: AppSettings) => {
    try {
      dataService.saveSettings(settings);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
