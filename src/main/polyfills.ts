// ============================================================
// polyfills — APIs Web ausentes no Node.js 18 (Electron 28)
// DEVE ser importado ANTES de qualquer outro módulo em index.ts
// ============================================================

/**
 * Cheerio 1.x importa `undici` que precisa de `File` como global.
 * Node.js 18 não tem `File` nativo (só adicionado no Node.js 20+).
 * Este polyfill mínimo satisfaz o undici sem quebrar nada.
 */
if (typeof globalThis.File === "undefined") {
  class FilePolyfill extends Blob {
    readonly name: string;
    readonly lastModified: number;
    readonly webkitRelativePath: string = "";

    constructor(
      fileBits: unknown[],
      fileName: string,
      options?: { type?: string; lastModified?: number },
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      super(fileBits as any[], options);
      this.name = fileName;
      this.lastModified = options?.lastModified ?? Date.now();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).File = FilePolyfill;
}

/**
 * `FormData` pode também não estar disponível em Node.js 18.
 * Electron expõe o Blob mas FormData pode faltar em versões antigas.
 */
if (typeof globalThis.FormData === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).FormData = class FormData {
    private _data: Map<string, string | Blob> = new Map();
    append(name: string, value: string | Blob): void {
      this._data.set(name, value);
    }
    get(name: string): string | Blob | null {
      return this._data.get(name) ?? null;
    }
  };
}
