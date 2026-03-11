// ============================================================
// FontManagerService — SOP: gerencia fontes locais instaladas
// Responsabilidade única: detectar, instalar e desinstalar fontes
// no sistema operacional do usuário.
// ============================================================
import { join } from "path";
import { existsSync, readdirSync, unlinkSync } from "fs";
import { Font, FontCategory } from "../../shared/types";
import { AppDataService } from "./AppDataService";
import {
  getUserFontDir,
  scanInstalledFontFiles,
  installFontFile,
  isFontFile,
} from "../utils/platformUtils";
import { logger } from "../utils/logger";

const CTX = "FontManagerService";

// Map from filename pattern to font metadata
function fileNameToFontName(fileName: string): string {
  return fileName
    .replace(/\.(ttf|otf|woff2|woff)$/i, "")
    .replace(/[-_]/g, " ")
    .trim();
}

function guessCategory(name: string): FontCategory {
  const lower = name.toLowerCase();
  if (/mono|code|console|term/.test(lower)) return "monospace";
  if (/serif/.test(lower)) return "serif";
  if (/hand|script|brush|ink|pen/.test(lower)) return "handwriting";
  if (/display|poster|deco|art/.test(lower)) return "display";
  return "sans-serif";
}

export class FontManagerService {
  constructor(private readonly dataService: AppDataService) {}

  // -------------------------------------------------------
  // Scan system for installed fonts
  // -------------------------------------------------------
  async scanSystemFonts(): Promise<Font[]> {
    logger.info(CTX, "Scanning system fonts...");

    const files = scanInstalledFontFiles();
    const fonts: Font[] = [];
    const seen = new Set<string>();

    for (const filePath of files) {
      const fileName = filePath.split(/[\\/]/).pop() || "";
      if (!isFontFile(fileName)) continue;

      const name = fileNameToFontName(fileName);
      const id = `local:${name.toLowerCase().replace(/\s+/g, "-")}`;

      if (seen.has(id)) continue;
      seen.add(id);

      const font: Font = {
        id,
        name,
        family: name,
        category: guessCategory(name),
        tags: ["local"],
        variants: [{ weight: 400, style: "normal", url: `file://${filePath}` }],
        source: "local",
        sourceUrl: filePath,
        license: "unknown",
        downloadUrl: "",
        isInstalled: true,
        isFavorite: this.dataService.isFavorite(id),
        localPath: filePath,
        installedAt: undefined,
      };

      fonts.push(font);
    }

    logger.info(CTX, `Found ${fonts.length} system fonts`);
    return fonts;
  }

  // -------------------------------------------------------
  // Install downloaded font files from a directory
  // -------------------------------------------------------
  async installFromDir(fontId: string, extractedDir: string): Promise<void> {
    logger.info(CTX, `Installing font ${fontId} from ${extractedDir}`);

    if (!existsSync(extractedDir)) {
      throw new Error(`Extracted directory not found: ${extractedDir}`);
    }

    const files = this.collectFontFiles(extractedDir);

    if (files.length === 0) {
      throw new Error(`No font files found in: ${extractedDir}`);
    }

    for (const file of files) {
      await installFontFile(file);
      logger.info(CTX, `Installed: ${file}`);
    }

    this.dataService.markAsInstalled(fontId);
    logger.info(
      CTX,
      `Font ${fontId} installed successfully (${files.length} files)`,
    );
  }

  private collectFontFiles(dir: string, depth = 0): string[] {
    if (depth > 3) return [];
    const result: string[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isFile() && isFontFile(entry.name)) {
          result.push(fullPath);
        } else if (entry.isDirectory()) {
          result.push(...this.collectFontFiles(fullPath, depth + 1));
        }
      }
    } catch (err) {
      logger.warn(CTX, `Could not read dir: ${dir}`, err);
    }

    return result;
  }

  // -------------------------------------------------------
  // Uninstall a font (remove from user fonts directory)
  // -------------------------------------------------------
  async uninstallFont(fontId: string, fontName: string): Promise<void> {
    logger.info(CTX, `Uninstalling font ${fontId}`);

    const userFontDir = getUserFontDir();
    if (!existsSync(userFontDir)) {
      throw new Error("User font directory not found");
    }

    const entries = readdirSync(userFontDir, { withFileTypes: true });
    const normalizedName = fontName.toLowerCase().replace(/\s+/g, "");
    let removed = 0;

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const entryLower = entry.name.toLowerCase().replace(/[-_\s]/g, "");
      if (entryLower.startsWith(normalizedName) && isFontFile(entry.name)) {
        try {
          unlinkSync(join(userFontDir, entry.name));
          removed++;
          logger.info(CTX, `Removed: ${entry.name}`);
        } catch (err) {
          logger.warn(CTX, `Could not remove ${entry.name}`, err);
        }
      }
    }

    this.dataService.markAsUninstalled(fontId);
    logger.info(CTX, `Uninstalled ${removed} files for font ${fontName}`);
  }

  // -------------------------------------------------------
  // Check if specific font is installed
  // -------------------------------------------------------
  isInstalled(fontId: string): boolean {
    return this.dataService.isInstalled(fontId);
  }
}
