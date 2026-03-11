// ============================================================
// DownloadPanel — painel de progresso de downloads
// ============================================================
import React from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { DownloadTask, DownloadStatus } from "@shared/types";
import { useDownloadStore } from "../../store/useDownloadStore";

const TaskItem: React.FC<{ task: DownloadTask }> = ({ task }) => {
  const { t } = useTranslation();
  const cancelDownload = useDownloadStore((s) => s.cancelDownload);

  const isActive =
    task.status === "downloading" ||
    task.status === "installing" ||
    task.status === "extracting";
  const isError = task.status === "error";
  const isDone = task.status === "completed";
  const isCancelled = task.status === "cancelled";

  return (
    <div className="px-4 py-3 border-b border-border last:border-0">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isDone && <CheckCircle size={14} className="text-success" />}
          {isError && <AlertCircle size={14} className="text-danger" />}
          {isCancelled && <XCircle size={14} className="text-muted" />}
          {isActive && (
            <Loader2 size={14} className="text-primary animate-spin" />
          )}
          {task.status === "pending" && (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-muted" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white text-xs font-medium truncate">
              {task.fontName}
            </p>
            {isActive && (
              <button
                onClick={() => cancelDownload(task.id)}
                className="text-muted hover:text-white flex-shrink-0"
                title={t("downloads.cancel")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <p
            className={`text-[10px] mt-0.5 ${
              isError
                ? "text-danger"
                : isCancelled
                  ? "text-muted"
                  : isDone
                    ? "text-success"
                    : "text-muted"
            }`}
          >
            {isError
              ? task.error || t("downloads.unknownError")
              : t(`downloads.status.${task.status}`)}
            {isActive && task.progress > 0 && ` · ${task.progress}%`}
          </p>

          {/* Progress bar */}
          {isActive && (
            <div className="mt-1.5 h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, task.progress)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DownloadPanel: React.FC = () => {
  const { t } = useTranslation();
  const tasks = useDownloadStore((s) => s.tasks);
  const panelOpen = useDownloadStore((s) => s.panelOpen);
  const setPanelOpen = useDownloadStore((s) => s.setPanelOpen);
  const clearCompleted = useDownloadStore((s) => s.clearCompleted);

  const hasCompleted = tasks.some(
    (t) =>
      t.status === "completed" ||
      t.status === "error" ||
      t.status === "cancelled",
  );
  const activeCount = tasks.filter(
    (t) =>
      t.status === "downloading" ||
      t.status === "installing" ||
      t.status === "extracting",
  ).length;

  if (!panelOpen) return null;

  return (
    <div className="absolute right-0 bottom-0 z-50 w-80 bg-background-secondary border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Downloads</span>
          {activeCount > 0 && (
            <span className="bg-primary/20 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full">
              {activeCount} ativo{activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasCompleted && (
            <button
              onClick={clearCompleted}
              className="text-muted hover:text-white transition-colors"
              title="Limpar concluídos"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => setPanelOpen(false)}
            className="text-muted hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="max-h-80 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted text-sm">
            Nenhum download ainda
          </div>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};
