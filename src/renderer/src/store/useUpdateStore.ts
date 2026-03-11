// ============================================================
// useUpdateStore — estado global do fluxo de atualização automática
// ============================================================
import { create } from "zustand";

export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

type UpdatePhase =
  | "idle" // Nenhuma atualização
  | "available" // Nova versão encontrada, aguarda decisão do usuário
  | "downloading" // Baixando
  | "downloaded" // Pronto para instalar
  | "error"; // Falha no download

interface UpdateState {
  phase: UpdatePhase;
  updateInfo: UpdateInfo | null;
  downloadProgress: number;
  error: string | null;
  showDialog: boolean; // Controla visibilidade do modal
  deferred: boolean; // Usuário adiou — mostra badge no header

  // Actions
  setAvailable: (info: UpdateInfo) => void;
  setDownloading: () => void;
  setProgress: (pct: number) => void;
  setDownloaded: () => void;
  setError: (msg: string) => void;
  openDialog: () => void;
  defer: () => void;
  reset: () => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  phase: "idle",
  updateInfo: null,
  downloadProgress: 0,
  error: null,
  showDialog: false,
  deferred: false,

  setAvailable: (info) =>
    set({
      phase: "available",
      updateInfo: info,
      showDialog: true,
      deferred: false,
      error: null,
    }),

  setDownloading: () =>
    set({ phase: "downloading", downloadProgress: 0, error: null }),

  setProgress: (pct) => set({ downloadProgress: pct }),

  setDownloaded: () =>
    set({ phase: "downloaded", downloadProgress: 100, showDialog: true }),

  setError: (msg) => set({ phase: "error", error: msg, showDialog: true }),

  openDialog: () => set({ showDialog: true }),

  defer: () => set({ showDialog: false, deferred: true }),

  reset: () =>
    set({
      phase: "idle",
      updateInfo: null,
      downloadProgress: 0,
      error: null,
      showDialog: false,
      deferred: false,
    }),
}));
