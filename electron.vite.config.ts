import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

/**
 * Polyfill injetado no TOPO do bundle do processo main (antes de qualquer require).
 * Necessário porque cheerio 1.x depende de undici que requer `File` como global.
 * Node.js 18 (usado pelo Electron 28) não tem `File` nativo (adicionado no Node 20).
 */
const mainBanner = `
"use strict";
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class FilePolyfill extends Blob {
    constructor(bits, name, opts) {
      super(bits, opts);
      this.name = name;
      this.lastModified = (opts && opts.lastModified) || Date.now();
      this.webkitRelativePath = '';
    }
  };
}
`;

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@main": resolve("src/main"),
        "@shared": resolve("src/shared"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          banner: mainBanner,
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared"),
      },
    },
    plugins: [react()],
  },
});
