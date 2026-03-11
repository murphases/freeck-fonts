// ============================================================
// ViewControls — toggle grid/lista + slider de tamanho de preview
// ============================================================
import React from "react";
import { LayoutGrid, List, Type } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const ViewControls: React.FC = () => {
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const previewFontSize = useAppStore((s) => s.previewFontSize);
  const setPreviewFontSize = useAppStore((s) => s.setPreviewFontSize);

  return (
    <div className="flex items-center gap-3">
      {/* Slider de tamanho */}
      <div
        className="flex items-center gap-2"
        title="Tamanho da pré-visualização"
      >
        <Type size={12} className="text-muted flex-shrink-0" />
        <input
          type="range"
          min={12}
          max={64}
          value={previewFontSize}
          onChange={(e) => setPreviewFontSize(Number(e.target.value))}
          className="w-20 accent-primary cursor-pointer"
        />
        <span className="text-muted text-xs w-6 text-right tabular-nums">
          {previewFontSize}
        </span>
      </div>

      {/* Toggle grid / lista */}
      <div className="flex items-center border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-1.5 transition-colors ${
            viewMode === "grid"
              ? "bg-primary/20 text-primary"
              : "text-muted hover:text-white hover:bg-surface"
          }`}
          title="Modo grade"
        >
          <LayoutGrid size={14} />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-1.5 transition-colors ${
            viewMode === "list"
              ? "bg-primary/20 text-primary"
              : "text-muted hover:text-white hover:bg-surface"
          }`}
          title="Modo lista"
        >
          <List size={14} />
        </button>
      </div>
    </div>
  );
};
