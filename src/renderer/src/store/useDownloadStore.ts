// ============================================================
// useDownloadStore — estado e eventos de downloads em tempo real
// ============================================================
import { create } from "zustand";
import { DownloadTask } from "@shared/types";
import { bridge } from "../utils/bridge";
import { useFontStore } from "./useFontStore";

interface DownloadState {
  tasks: DownloadTask[];
  panelOpen: boolean;

  loadTasks: () => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  setPanelOpen: (open: boolean) => void;

  // Called by event listeners
  upsertTask: (task: DownloadTask) => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  tasks: [],
  panelOpen: false,

  loadTasks: async () => {
    const res = await bridge.downloads.getAll();
    if (res.success && res.data) {
      set({ tasks: res.data });
    }
  },

  cancelDownload: async (id) => {
    await bridge.downloads.cancel(id);
    get().upsertTask({
      ...get().tasks.find((t) => t.id === id)!,
      status: "cancelled",
    });
  },

  clearCompleted: async () => {
    await bridge.downloads.clear();
    set((s) => ({
      tasks: s.tasks.filter(
        (t) =>
          t.status !== "completed" &&
          t.status !== "error" &&
          t.status !== "cancelled",
      ),
    }));
  },

  setPanelOpen: (open) => set({ panelOpen: open }),

  upsertTask: (task) => {
    set((s) => {
      const idx = s.tasks.findIndex((t) => t.id === task.id);
      if (idx === -1) {
        return { tasks: [task, ...s.tasks] };
      }
      const updated = [...s.tasks];
      updated[idx] = task;
      return { tasks: updated };
    });

    // When a font is installed, update font list
    if (task.status === "completed") {
      useFontStore
        .getState()
        .updateFontInList(task.fontId, { isInstalled: true });
    }
  },
}));

// -------------------------------------------------------
// Initialize event listeners (called once from App.tsx)
// -------------------------------------------------------
export function initDownloadEvents(): () => void {
  const { upsertTask } = useDownloadStore.getState();

  const unsubProgress = bridge.events.onDownloadProgress((task) => {
    upsertTask(task);
    useDownloadStore.setState({ panelOpen: true });
  });

  const unsubComplete = bridge.events.onDownloadComplete((task) => {
    upsertTask(task);
    useFontStore.getState().fetchInstalled();
  });

  const unsubError = bridge.events.onDownloadError((task) => {
    upsertTask(task);
  });

  const unsubInstalled = bridge.events.onFontInstalled(({ fontId }) => {
    useFontStore.getState().updateFontInList(fontId, { isInstalled: true });
  });

  return () => {
    unsubProgress();
    unsubComplete();
    unsubError();
    unsubInstalled();
  };
}
