// ============================================================
// PlatformUtils — SOP: abstração de operações específicas por OS
// ============================================================
import { join } from "path";
import { execSync, exec } from "child_process";
import { existsSync, mkdirSync, copyFileSync, readdirSync } from "fs";
import { promisify } from "util";
import { homedir } from "os";

const execAsync = promisify(exec);

export type Platform = "win32" | "darwin" | "linux";

export function getPlatform(): Platform {
  return process.platform as Platform;
}

// -------------------------------------------------------
// Font Directories
// -------------------------------------------------------
export function getSystemFontDirs(): string[] {
  const platform = getPlatform();
  switch (platform) {
    case "win32":
      return [
        join(process.env.WINDIR || "C:\\Windows", "Fonts"),
        join(process.env.LOCALAPPDATA || "", "Microsoft", "Windows", "Fonts"),
      ];
    case "darwin":
      return [
        "/System/Library/Fonts",
        "/Library/Fonts",
        join(homedir(), "Library", "Fonts"),
      ];
    case "linux":
      return [
        "/usr/share/fonts",
        "/usr/local/share/fonts",
        join(homedir(), ".local", "share", "fonts"),
        join(homedir(), ".fonts"),
      ];
    default:
      return [];
  }
}

export function getUserFontDir(): string {
  const platform = getPlatform();
  switch (platform) {
    case "win32":
      return join(
        process.env.LOCALAPPDATA || homedir(),
        "Microsoft",
        "Windows",
        "Fonts",
      );
    case "darwin":
      return join(homedir(), "Library", "Fonts");
    case "linux":
      return join(homedir(), ".local", "share", "fonts");
    default:
      return join(homedir(), "Fonts");
  }
}

// -------------------------------------------------------
// Font File Extensions
// -------------------------------------------------------
export const FONT_EXTENSIONS = [".ttf", ".otf", ".woff", ".woff2"];

export function isFontFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return FONT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// -------------------------------------------------------
// Install Font (SOP: instalação normalizada por plataforma)
// -------------------------------------------------------
export async function installFontFile(fontFilePath: string): Promise<void> {
  const platform = getPlatform();
  const userFontDir = getUserFontDir();

  // Ensure user font directory exists
  if (!existsSync(userFontDir)) {
    mkdirSync(userFontDir, { recursive: true });
  }

  const fileName = fontFilePath.split(/[\\/]/).pop()!;
  const destPath = join(userFontDir, fileName);

  // Copy font file
  copyFileSync(fontFilePath, destPath);

  // Platform-specific post-install actions
  if (platform === "linux") {
    try {
      await execAsync("fc-cache -f -v");
    } catch {
      // fc-cache may not be available, fonts will still work after restart
    }
  } else if (platform === "win32") {
    // Register font in Windows registry (user-level, no admin required)
    try {
      const fontName = fileName.replace(/\.(ttf|otf)$/i, " (TrueType)");
      const regKey =
        "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts";
      execSync(
        `reg add "${regKey}" /v "${fontName}" /t REG_SZ /d "${destPath}" /f`,
        {
          stdio: "ignore",
        },
      );
    } catch {
      // Registry entry is optional; font file is copied either way
    }
  }
}

// -------------------------------------------------------
// Scan Installed Fonts
// -------------------------------------------------------
export function scanInstalledFontFiles(): string[] {
  const dirs = getSystemFontDirs();
  const files: string[] = [];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && isFontFile(entry.name)) {
          files.push(join(dir, entry.name));
        } else if (entry.isDirectory()) {
          // One level deep
          try {
            const sub = readdirSync(join(dir, entry.name), {
              withFileTypes: true,
            });
            for (const s of sub) {
              if (s.isFile() && isFontFile(s.name)) {
                files.push(join(dir, entry.name, s.name));
              }
            }
          } catch {
            // Skip unreadable subdirectory
          }
        }
      }
    } catch {
      // Skip unreadable directory
    }
  }

  return files;
}

// -------------------------------------------------------
// Open path in system file manager
// -------------------------------------------------------
export function openPathInExplorer(dirPath: string): void {
  const platform = getPlatform();
  switch (platform) {
    case "win32":
      execSync(`explorer "${dirPath}"`);
      break;
    case "darwin":
      execSync(`open "${dirPath}"`);
      break;
    case "linux":
      exec(`xdg-open "${dirPath}"`);
      break;
  }
}
