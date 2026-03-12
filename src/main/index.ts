// ============================================================
// Main Process Entry — FreeckFonts
// SOP: inicialização ordenada de todos os serviços e handlers
// ============================================================

// MUST be first: polyfills de APIs Web ausentes no Node.js 18 (Electron 28)
import "./polyfills";

import { app, BrowserWindow, shell, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";

import { AppDataService } from "./services/AppDataService";
import { FontManagerService } from "./services/FontManagerService";
import { DownloadService } from "./services/DownloadService";
import { SourceRegistry } from "./services/sources/SourceRegistry";

import { registerFontHandlers } from "./ipc/fontHandlers";
import { registerDownloadHandlers } from "./ipc/downloadHandlers";
import { registerSettingsHandlers } from "./ipc/settingsHandlers";
import { registerSystemHandlers } from "./ipc/systemHandlers";
import { registerUpdateHandlers } from "./ipc/updateHandlers";
import { UpdateService } from "./services/UpdateService";
import { logger } from "./utils/logger";

// -------------------------------------------------------
// Instantiate core services (Singleton pattern via module scope)
// -------------------------------------------------------
const appDataService = new AppDataService();
const fontManagerService = new FontManagerService(appDataService);

let mainWindow: BrowserWindow | null = null;

const downloadService = new DownloadService(
  appDataService,
  fontManagerService,
  () => mainWindow,
);

const sourceRegistry = new SourceRegistry(appDataService);
const updateService = new UpdateService(() => mainWindow);

// -------------------------------------------------------
// Window Factory
// -------------------------------------------------------
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#0f1117",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon:
      process.platform === "win32"
        ? join(__dirname, "../../resources/icon.ico")
        : join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow!.show();
    logger.info("Main", "Window ready to show");
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Load the Vite dev server or production build
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------
// App Lifecycle
// -------------------------------------------------------
app.whenReady().then(async () => {
  // Set App User Model ID (Windows taskbar)
  electronApp.setAppUserModelId("com.freeckfonts.app");

  // Optimize window shortcuts in dev
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Initialize persistent data store
  await appDataService.initialize();
  logger.info("Main", "App data service initialized");

  // Register all IPC handlers (SOP: register before window creation)
  registerFontHandlers(
    ipcMain,
    appDataService,
    fontManagerService,
    sourceRegistry,
  );
  registerDownloadHandlers(ipcMain, downloadService, appDataService);
  registerSettingsHandlers(ipcMain, appDataService);
  registerSystemHandlers(ipcMain);
  registerUpdateHandlers(ipcMain, updateService);
  logger.info("Main", "All IPC handlers registered");

  // Create the main window
  createWindow();

  // Verifica atualizações 4s após a janela abrir (não interfere no startup)
  setTimeout(() => updateService.checkForUpdates(), 4000);

  // macOS: re-create window when dock icon is clicked
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  logger.info("Main", `FreeckFonts started — Platform: ${process.platform}`);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  logger.info("Main", "App quitting");
});
