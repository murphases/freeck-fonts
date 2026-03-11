// ============================================================
// updateHandlers — SOP: handlers IPC para o fluxo de atualização
// ============================================================
import { IpcMain } from "electron";
import { UpdateService } from "../services/UpdateService";

export function registerUpdateHandlers(
  ipcMain: IpcMain,
  updateService: UpdateService,
): void {
  // Renderer solicita download após confirmação do usuário
  ipcMain.handle("update:download", async () => {
    updateService.downloadUpdate();
    return { success: true };
  });

  // Renderer solicita reinicialização para instalar
  ipcMain.handle("update:install", async () => {
    updateService.quitAndInstall();
    return { success: true };
  });
}
