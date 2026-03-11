// ============================================================
// UpdateDialog — modal de confirmação e progresso de atualização
// ============================================================
import React from "react";
import { ArrowUpCircle, RotateCcw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdateStore } from "../../store/useUpdateStore";
import { bridge } from "../../utils/bridge";

export const UpdateDialog: React.FC = () => {
  const { t } = useTranslation();
  const phase = useUpdateStore((s) => s.phase);
  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const downloadProgress = useUpdateStore((s) => s.downloadProgress);
  const error = useUpdateStore((s) => s.error);
  const showDialog = useUpdateStore((s) => s.showDialog);
  const setDownloading = useUpdateStore((s) => s.setDownloading);
  const defer = useUpdateStore((s) => s.defer);

  if (!showDialog || !updateInfo) return null;

  const handleUpdateNow = async () => {
    setDownloading();
    await bridge.update.download();
  };

  const handleInstall = async () => {
    await bridge.update.install();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background-secondary border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
              {phase === "downloaded" ? (
                <RotateCcw size={18} className="text-primary" />
              ) : (
                <ArrowUpCircle size={18} className="text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                {phase === "downloaded"
                  ? t("update.readyTitle")
                  : phase === "error"
                    ? t("update.errorTitle")
                    : t("update.availableTitle")}
              </h3>
              <p className="text-muted text-xs mt-0.5">v{updateInfo.version}</p>
            </div>
          </div>

          {/* Fechar só quando não está baixando */}
          {phase !== "downloading" && (
            <button
              onClick={defer}
              className="text-muted hover:text-white transition-colors ml-2 flex-shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          {/* Mensagem */}
          {phase === "available" && (
            <p className="text-muted text-sm">
              {t("update.description", { version: updateInfo.version })}
            </p>
          )}

          {phase === "downloading" && (
            <div className="space-y-2">
              <p className="text-muted text-sm">{t("update.downloading")}</p>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-muted text-xs text-right">
                {downloadProgress}%
              </p>
            </div>
          )}

          {phase === "downloaded" && (
            <p className="text-muted text-sm">{t("update.readyDescription")}</p>
          )}

          {phase === "error" && (
            <p className="text-danger text-sm">
              {t("update.errorDescription")}
              {error && (
                <span className="block text-xs text-muted mt-1 font-mono">
                  {error}
                </span>
              )}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            {/* "Depois" — aparece nos estados que não são "baixando" */}
            {phase !== "downloading" && (
              <button
                onClick={defer}
                className="btn-ghost border border-border text-sm px-4 py-2"
              >
                {t("update.later")}
              </button>
            )}

            {phase === "available" && (
              <button
                onClick={handleUpdateNow}
                className="btn-primary text-sm px-4 py-2"
              >
                {t("update.updateNow")}
              </button>
            )}

            {phase === "downloaded" && (
              <button
                onClick={handleInstall}
                className="btn-primary text-sm px-4 py-2"
              >
                {t("update.restart")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
