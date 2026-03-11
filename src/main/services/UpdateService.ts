// ============================================================
// UpdateService — SOP: gerencia verificação e instalação de atualizações
// Usa electron-updater integrado ao electron-builder + GitHub Releases
// ============================================================
import { autoUpdater, UpdateInfo, ProgressInfo } from "electron-updater";
import { BrowserWindow } from "electron";
import { is } from "@electron-toolkit/utils";
import { logger } from "../utils/logger";

export class UpdateService {
  private getWindow: () => BrowserWindow | null;

  constructor(getWindow: () => BrowserWindow | null) {
    this.getWindow = getWindow;

    // Não baixa automaticamente — aguarda confirmação do usuário
    autoUpdater.autoDownload = false;
    // Instala ao fechar o app se o usuário tiver deferido
    autoUpdater.autoInstallOnAppQuit = true;
    // Não notifica via sistema operacional — fazemos isso pela UI
    autoUpdater.autoRunAppAfterInstall = true;

    this.setupListeners();
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  private send(channel: string, ...args: unknown[]): void {
    const win = this.getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }

  // -------------------------------------------------------
  // Event listeners (main → renderer via IPC push)
  // -------------------------------------------------------
  private setupListeners(): void {
    autoUpdater.on("update-available", (info: UpdateInfo) => {
      logger.info("Updater", `Nova versão disponível: v${info.version}`);
      this.send("update:available", {
        version: info.version,
        releaseNotes:
          typeof info.releaseNotes === "string" ? info.releaseNotes : "",
      });
    });

    autoUpdater.on("update-not-available", () => {
      logger.info("Updater", "Nenhuma atualização disponível");
      this.send("update:not-available");
    });

    autoUpdater.on("download-progress", (progress: ProgressInfo) => {
      this.send("update:progress", Math.round(progress.percent));
    });

    autoUpdater.on("update-downloaded", () => {
      logger.info("Updater", "Download concluído — pronto para instalar");
      this.send("update:downloaded");
    });

    autoUpdater.on("error", (err: Error) => {
      logger.error("Updater", `Erro: ${err.message}`);
      this.send("update:error", err.message);
    });
  }

  // -------------------------------------------------------
  // Public API (chamada via IPC)
  // -------------------------------------------------------
  checkForUpdates(): void {
    if (is.dev) {
      logger.info("Updater", "Verificação ignorada em modo de desenvolvimento");
      return;
    }
    autoUpdater.checkForUpdates().catch((err: Error) => {
      logger.warn("Updater", `Falha na verificação: ${err.message}`);
    });
  }

  downloadUpdate(): void {
    autoUpdater.downloadUpdate().catch((err: Error) => {
      logger.error("Updater", `Falha no download: ${err.message}`);
      this.send("update:error", err.message);
    });
  }

  quitAndInstall(): void {
    // isSilent=false → mostra progresso; isForceRunAfter=true → reabre após instalar
    autoUpdater.quitAndInstall(false, true);
  }
}
