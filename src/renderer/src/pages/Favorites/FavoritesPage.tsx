// ============================================================
// FavoritesPage — fontes marcadas como favoritas
// ============================================================
import React from "react";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFontStore } from "../../store/useFontStore";
import { useAppStore } from "../../store/useAppStore";
import { FontCard } from "../../components/FontCard/FontCard";
import { FontPreview } from "../../components/FontPreview/FontPreview";
import { ViewControls } from "../../components/Layout/ViewControls";

export const FavoritesPage: React.FC = () => {
  const { t } = useTranslation();
  const favoriteFonts = useFontStore((s) => s.favoriteFonts);
  const toggleFavorite = useFontStore((s) => s.toggleFavorite);
  const downloadFont = useFontStore((s) => s.downloadFont);
  const selectedFont = useFontStore((s) => s.selectedFont);
  const selectFont = useFontStore((s) => s.selectFont);
  const filter = useFontStore((s) => s.filter);

  const previewText = useAppStore((s) => s.previewText);
  const viewMode = useAppStore((s) => s.viewMode);
  const previewFontSize = useAppStore((s) => s.previewFontSize);

  const filtered = favoriteFonts.filter((f) => {
    if (!filter.search) return true;
    const q = filter.search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) || f.family.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <p className="text-muted text-sm">
            {t("favorites.fontCount", { count: filtered.length })}
          </p>
          <ViewControls />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Heart size={48} className="text-muted/30" />
              <div className="text-center">
                <p className="text-white font-semibold">
                  {filter.search
                    ? t("favorites.emptySearch")
                    : t("favorites.empty")}
                </p>
                <p className="text-muted text-sm mt-1">
                  {filter.search
                    ? t("favorites.emptySearchHint")
                    : t("favorites.emptyHint")}
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
                  font={font}
                  previewText={previewText}
                  onSelect={selectFont}
                  onToggleFavorite={toggleFavorite}
                  onDownload={downloadFont}
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
