// ============================================================
// useUpdater — hook que conecta os eventos IPC de atualização ao store
// ============================================================
import { useEffect } from "react";
import { useUpdateStore, UpdateInfo } from "../store/useUpdateStore";

export function useUpdater(): void {
  const setAvailable = useUpdateStore((s) => s.setAvailable);
  const setProgress = useUpdateStore((s) => s.setProgress);
  const setDownloaded = useUpdateStore((s) => s.setDownloaded);
  const setError = useUpdateStore((s) => s.setError);

  useEffect(() => {
    const offAvailable = window.api.on("update:available", (info: unknown) => {
      setAvailable(info as UpdateInfo);
    });

    const offProgress = window.api.on("update:progress", (pct: unknown) => {
      setProgress(pct as number);
    });

    const offDownloaded = window.api.on("update:downloaded", () => {
      setDownloaded();
    });

    const offError = window.api.on("update:error", (msg: unknown) => {
      setError(msg as string);
    });

    // off para "not-available" não precisa de ação na UI
    const offNotAvailable = window.api.on("update:not-available", () => {});

    return () => {
      offAvailable();
      offProgress();
      offDownloaded();
      offError();
      offNotAvailable();
    };
  }, []);
}
