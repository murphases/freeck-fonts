// Type declarations for the API exposed by the preload script
// This allows TypeScript to type-check window.api calls in the renderer.

import type { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      invoke(channel: string, ...args: unknown[]): Promise<unknown>;
      on(channel: string, callback: (...args: unknown[]) => void): () => void;
      removeAllListeners(channel: string): void;
    };
  }
}
