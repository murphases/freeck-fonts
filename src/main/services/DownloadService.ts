// ============================================================
// DownloadService — SOP: orquestra download, extração e instalação
// Responsabilidade única: gerenciar o ciclo de vida completo de
// cada download com rastreamento de progresso e notificação.
// ============================================================
import { app, BrowserWindow } from "electron";
import { join } from "path";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  rmSync,
  openSync,
  readSync,
  closeSync,
  copyFileSync,
  writeFileSync,
} from "fs";
import axios from "axios";
import AdmZip from "adm-zip";

import { Font, DownloadTask, IPC } from "../../shared/types";
import { AppDataService } from "./AppDataService";
import { FontManagerService } from "./FontManagerService";
import { logger } from "../utils/logger";

const CTX = "DownloadService";

// Simple UUID-like ID generator (avoids external dep)
function generateId(): string {
  return `dl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class DownloadService {
  private active = new Map<string, AbortController>();
  private tempDir: string;

  constructor(
    private readonly dataService: AppDataService,
    private readonly fontManager: FontManagerService,
    private getMainWindow: () => BrowserWindow | null,
  ) {
    this.tempDir = join(app.getPath("temp"), "freeckfonts-downloads");
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // -------------------------------------------------------
  // Public: start a download
  // -------------------------------------------------------
  async startDownload(font: Font): Promise<DownloadTask> {
    const id = generateId();
    const task: DownloadTask = {
      id,
      fontId: font.id,
      fontName: font.name,
      source: font.source,
      downloadUrl: font.downloadUrl,
      progress: 0,
      status: "pending",
      startedAt: new Date().toISOString(),
    };

    this.dataService.upsertDownload(task);
    this.emit(IPC.EVT_DOWNLOAD_PROGRESS, task);

    // Start async (non-blocking)
    this.runDownload(task, font).catch((err) => {
      logger.error(CTX, `Download failed for ${font.name}`, err);
    });

    return task;
  }

  // -------------------------------------------------------
  // Public: cancel a download
  // -------------------------------------------------------
  cancel(downloadId: string): void {
    const controller = this.active.get(downloadId);
    if (controller) {
      controller.abort();
      this.active.delete(downloadId);
      logger.info(CTX, `Cancelled download ${downloadId}`);
    }
  }

  // -------------------------------------------------------
  // Internal: full download → extract → install pipeline
  // -------------------------------------------------------
  private async runDownload(task: DownloadTask, font: Font): Promise<void> {
    const controller = new AbortController();
    this.active.set(task.id, controller);

    const taskDir = join(this.tempDir, task.id);
    mkdirSync(taskDir, { recursive: true });

    try {
      // ----- Phase 1+2: Download & Extract -----
      task.status = "downloading";
      this.updateTask(task);

      const extractDir = join(taskDir, "extracted");
      mkdirSync(extractDir, { recursive: true });

      if (font.source === "google-fonts") {
        // Google Fonts: baixa cada variante TTF diretamente (evita redirecionamento do ZIP)
        await this.downloadGoogleFontVariants(
          font,
          extractDir,
          task,
          controller.signal,
        );
      } else {
        // Demais fontes: baixa ZIP/TTF único e extrai
        const zipPath = join(taskDir, "font.zip");
        await this.downloadFile(
          font.downloadUrl,
          zipPath,
          task,
          controller.signal,
        );

        if (controller.signal.aborted) {
          task.status = "cancelled";
          this.updateTask(task);
          return;
        }

        // ----- Phase 2: Detect & Extract -----
        task.status = "extracting";
        task.progress = 95;
        this.updateTask(task);

        const fileType = this.detectFileType(zipPath);

        if (fileType === "zip") {
          // Extrai apenas arquivos .ttf e .otf do ZIP
          const count = this.extractTtfOtfFromZip(zipPath, extractDir);
          logger.info(
            CTX,
            `ZIP: ${count} arquivo(s) TTF/OTF extraído(s) para ${font.name}`,
          );
        } else if (fileType === "ttf" || fileType === "otf") {
          // Arquivo de fonte direta — copia com extensão correta
          const safeName = font.name
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
          copyFileSync(zipPath, join(extractDir, `${safeName}.${fileType}`));
          logger.info(
            CTX,
            `Fonte direta (.${fileType}) detectada: ${font.name}`,
          );
        } else {
          throw new Error(
            fileType === "woff"
              ? "Formato WOFF/WOFF2 não suportado para instalação. Apenas TTF e OTF são aceitos."
              : "O arquivo baixado não é um ZIP, TTF ou OTF válido.",
          );
        }
      }

      if (controller.signal.aborted) {
        task.status = "cancelled";
        this.updateTask(task);
        return;
      }

      // ----- Phase 3: Install -----
      task.status = "installing";
      task.progress = 98;
      this.updateTask(task);

      await this.fontManager.installFromDir(font.id, extractDir);

      // ----- Done -----
      task.status = "completed";
      task.progress = 100;
      task.completedAt = new Date().toISOString();
      this.updateTask(task);

      // Cache font with updated installed flag
      this.dataService.cacheFont({
        ...font,
        isInstalled: true,
        localPath: extractDir,
      });
      this.emit(IPC.EVT_DOWNLOAD_COMPLETE, task);
      this.emit(IPC.EVT_FONT_INSTALLED, { fontId: font.id });

      logger.info(CTX, `Download complete: ${font.name}`);
    } catch (err: unknown) {
      if (
        (err as Error)?.name === "AbortError" ||
        (err as Error)?.message?.includes("abort")
      ) {
        task.status = "cancelled";
      } else {
        task.status = "error";
        task.error = (err as Error)?.message || "Unknown error";
        this.emit(IPC.EVT_DOWNLOAD_ERROR, task);
        logger.error(CTX, `Download error: ${font.name}`, err);
      }
      this.updateTask(task);
    } finally {
      this.active.delete(task.id);
      // Cleanup temp files after short delay
      setTimeout(() => {
        try {
          rmSync(taskDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }, 5000);
    }
  }

  private async downloadFile(
    url: string,
    destPath: string,
    task: DownloadTask,
    signal: AbortSignal,
    // Quando fornecido, chama o callback com valor 0–1 em vez de atualizar task.progress diretamente
    onProgress?: (normalized: number) => void,
  ): Promise<void> {
    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 60_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FreeckFonts/1.0",
      },
      signal: signal as AbortSignal,
    });

    const totalLength = parseInt(response.headers["content-length"] || "0", 10);
    let downloaded = 0;

    const writer = createWriteStream(destPath);
    response.data.on("data", (chunk: Buffer) => {
      downloaded += chunk.length;
      if (totalLength > 0) {
        // Clampear em 1 para evitar que bytes descomprimidos excedam o content-length
        const normalized = Math.min(1, downloaded / totalLength);
        if (onProgress) {
          onProgress(normalized);
        } else {
          task.progress = Math.floor(normalized * 90);
          this.updateTask(task);
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      // Tratar erro na readable stream para não deixar a Promise pendurada
      response.data.on("error", reject);
      response.data.pipe(writer);
    });
  }

  /** Baixa cada variante TTF do Google Fonts diretamente via fonts.gstatic.com */
  private async downloadGoogleFontVariants(
    font: Font,
    extractDir: string,
    task: DownloadTask,
    signal: AbortSignal,
  ): Promise<void> {
    const ttfVariants = font.variants.filter(
      (v) => v.url && (v.format === "ttf" || v.url.includes(".ttf")),
    );

    if (ttfVariants.length === 0) {
      throw new Error(
        "Nenhuma variante TTF encontrada para esta fonte do Google Fonts.",
      );
    }

    const safeName = font.family.replace(/[^\w]/g, "");

    for (let i = 0; i < ttfVariants.length; i++) {
      if (signal.aborted) break;
      const variant = ttfVariants[i];
      const styleSuffix = variant.style === "italic" ? "Italic" : "";
      const fileName = `${safeName}-${variant.weight}${styleSuffix}.ttf`;
      const destPath = join(extractDir, fileName);

      // Cada variante ocupa uma fatia proporcional da faixa 10–90%
      const sliceStart = 10 + (i / ttfVariants.length) * 80;
      const sliceEnd = 10 + ((i + 1) / ttfVariants.length) * 80;

      await this.downloadFile(
        variant.url,
        destPath,
        task,
        signal,
        (normalized) => {
          task.progress = Math.floor(
            sliceStart + normalized * (sliceEnd - sliceStart),
          );
          this.updateTask(task);
        },
      );

      // Garante que o progresso chegue exatamente ao fim da fatia
      task.progress = Math.floor(sliceEnd);
      this.updateTask(task);

      logger.info(CTX, `Google Fonts TTF baixado: ${fileName}`);
    }
  }

  private detectFileType(
    filePath: string,
  ): "zip" | "ttf" | "otf" | "woff" | "unknown" {
    try {
      const buf = Buffer.alloc(4);
      const fd = openSync(filePath, "r");
      readSync(fd, buf, 0, 4, 0);
      closeSync(fd);
      const sig = buf.toString("ascii", 0, 4);
      // ZIP magic: PK
      if (buf[0] === 0x50 && buf[1] === 0x4b) return "zip";
      // OTF: OTTO
      if (sig === "OTTO") return "otf";
      // TTF: 00 01 00 00 ou "true"
      if ((buf[0] === 0x00 && buf[1] === 0x01) || sig === "true") return "ttf";
      // WOFF / WOFF2 (não suportados)
      if (sig === "wOFF" || sig === "wOF2") return "woff";
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  /** Extrai do ZIP apenas entradas .ttf e .otf para destDir. */
  private extractTtfOtfFromZip(zipPath: string, destDir: string): number {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries().filter((e) => {
      if (e.isDirectory) return false;
      const name = e.name.toLowerCase();
      return name.endsWith(".ttf") || name.endsWith(".otf");
    });

    if (entries.length === 0) {
      throw new Error("Nenhum arquivo .ttf ou .otf encontrado dentro do ZIP.");
    }

    for (const entry of entries) {
      const data = entry.getData();
      writeFileSync(join(destDir, entry.name), data);
      logger.info(CTX, `Extraído: ${entry.name}`);
    }

    return entries.length;
  }

  private async extract(zipPath: string, destDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(destDir, true);
        resolve();
      } catch (err) {
        reject(new Error(`ZIP extraction failed: ${(err as Error).message}`));
      }
    });
  }

  private updateTask(task: DownloadTask): void {
    this.dataService.upsertDownload(task);
    this.emit(IPC.EVT_DOWNLOAD_PROGRESS, task);
  }

  private emit(channel: string, data: unknown): void {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}
