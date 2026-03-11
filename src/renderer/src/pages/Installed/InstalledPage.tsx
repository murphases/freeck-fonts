// ============================================================
// InstalledPage — fontes instaladas no sistema
// ============================================================
import React, { useEffect } from "react";
import { HardDrive, RefreshCw, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFontStore } from "../../store/useFontStore";
import { useAppStore } from "../../store/useAppStore";
import { FontCard } from "../../components/FontCard/FontCard";
import { FontPreview } from "../../components/FontPreview/FontPreview";
import { ViewControls } from "../../components/Layout/ViewControls";
import { bridge } from "../../utils/bridge";

export const InstalledPage: React.FC = () => {
  const { t } = useTranslation();
  const installedFonts = useFontStore((s) => s.installedFonts);
  const fetchInstalled = useFontStore((s) => s.fetchInstalled);
  const toggleFavorite = useFontStore((s) => s.toggleFavorite);
  const uninstallFont = useFontStore((s) => s.uninstallFont);
  const selectedFont = useFontStore((s) => s.selectedFont);
  const selectFont = useFontStore((s) => s.selectFont);
  const filter = useFontStore((s) => s.filter);

  const previewText = useAppStore((s) => s.previewText);
  const viewMode = useAppStore((s) => s.viewMode);
  const previewFontSize = useAppStore((s) => s.previewFontSize);

  useEffect(() => {
    fetchInstalled();
  }, []);

  const filtered = installedFonts.filter((f) => {
    if (!filter.search) return true;
    const q = filter.search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) || f.family.toLowerCase().includes(q)
    );
  });

  const openFontsFolder = async () => {
    const res = await bridge.system.getFontsDir();
    if (res.success && res.data) await bridge.system.openPath(res.data);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <p className="text-muted text-sm">
            {t("installed.fontCount", { count: filtered.length })}
          </p>
          <div className="flex items-center gap-2">
            <ViewControls />
            <button
              onClick={openFontsFolder}
              className="btn-ghost flex items-center gap-2 text-xs border border-border"
            >
              <FolderOpen size={13} />
              {t("installed.openFolder")}
            </button>
            <button
              onClick={fetchInstalled}
              className="btn-ghost flex items-center gap-2 text-xs border border-border"
            >
              <RefreshCw size={13} />
              {t("installed.refresh")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <HardDrive size={48} className="text-muted/30" />
              <div className="text-center">
                <p className="text-white font-semibold">
                  {filter.search
                    ? t("installed.emptySearch")
                    : t("installed.empty")}
                </p>
                <p className="text-muted text-sm mt-1">
                  {filter.search
                    ? t("installed.emptySearchHint")
                    : t("installed.emptyHint")}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-2"
                  : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
              }
            >
              {filtered.map((font) => (
                <FontCard
                  key={font.id}
                  font={{ ...font, isInstalled: true }}
                  previewText={previewText}
                  onSelect={selectFont}
                  onToggleFavorite={toggleFavorite}
                  onDownload={() => {}}
                  viewMode={viewMode}
                  previewFontSize={previewFontSize}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview panel */}
      {selectedFont && (
        <FontPreview font={selectedFont} onClose={() => selectFont(null)} />
      )}
    </div>
  );
};
