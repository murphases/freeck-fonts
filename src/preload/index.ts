// ============================================================
// Preload Script — SOP: ponte segura entre main e renderer
// expõe apenas os métodos necessários via contextBridge.
// ============================================================
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Type-safe API exposed to renderer
const api = {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),

  on: (
    channel: string,
    callback: (...args: unknown[]) => void,
  ): (() => void) => {
    const handler = (_event: IpcRendererEvent, ...args: unknown[]): void =>
      callback(...args);
    ipcRenderer.on(channel, handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener(channel, handler);
  },

  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (err) {
    console.error("Preload: Failed to expose API", err);
  }
} else {
  // @ts-ignore (fallback for non-isolated contexts, dev only)
  window.electron = electronAPI;
  // @ts-ignore
  window.api = api;
}
