// ============================================================
// BrowsePage — página principal de exploração de fontes
// ============================================================
import React, { useEffect, useCallback, useRef } from "react";
import { Globe, RefreshCw, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFontStore } from "../../store/useFontStore";
import { useDownloadStore } from "../../store/useDownloadStore";
import { useAppStore } from "../../store/useAppStore";
import { FontCard } from "../../components/FontCard/FontCard";
import { FontPreview } from "../../components/FontPreview/FontPreview";
import { ViewControls } from "../../components/Layout/ViewControls";
import { FONT_SOURCES, FontSource } from "@shared/types";

const ALL_SOURCES: FontSource[] = [
  "google-fonts",
  "font-squirrel",
  "font-library",
  "open-foundry",
  "fontspace",
  "1001-fonts",
];

export const BrowsePage: React.FC = () => {
  const { t } = useTranslation();
  const fonts = useFontStore((s) => s.fonts);
  const isLoading = useFontStore((s) => s.isLoading);
  const loadError = useFontStore((s) => s.loadError);
  const hasMore = useFontStore((s) => s.hasMore);
  const currentPage = useFontStore((s) => s.currentPage);
  const fetchFonts = useFontStore((s) => s.fetchFonts);
  const fetchAllFonts = useFontStore((s) => s.fetchAllFonts);
  const filter = useFontStore((s) => s.filter);
  const activeSource = useFontStore((s) => s.activeSource);
  const setActiveSource = useFontStore((s) => s.setActiveSource);
  const toggleFavorite = useFontStore((s) => s.toggleFavorite);
  const downloadFont = useFontStore((s) => s.downloadFont);
  const selectedFont = useFontStore((s) => s.selectedFont);
  const selectFont = useFontStore((s) => s.selectFont);

  const previewText = useAppStore((s) => s.previewText);
  const viewMode = useAppStore((s) => s.viewMode);
  const previewFontSize = useAppStore((s) => s.previewFontSize);
  const downloadTasks = useDownloadStore((s) => s.tasks);

  const doFetch = useCallback(
    (page: number, reset: boolean) => {
      if (activeSource === "all") {
        fetchAllFonts(page, reset);
      } else {
        fetchFonts(activeSource as FontSource, page, reset);
      }
    },
    [activeSource, fetchFonts, fetchAllFonts],
  );

  // Load on mount and filter change
  useEffect(() => {
    doFetch(1, true);
  }, [
    activeSource,
    filter.sortBy,
    filter.sortOrder,
    filter.categories,
    filter.licenses,
    filter.sources,
  ]);

  // Re-search on search text change
  useEffect(() => {
    if (filter.search !== undefined) {
      doFetch(1, true);
    }
  }, [filter.search]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      doFetch(currentPage + 1, false);
    }
  };

  const isDownloading = (fontId: string) =>
    downloadTasks.some(
      (t) =>
        t.fontId === fontId &&
        (t.status === "downloading" ||
          t.status === "installing" ||
          t.status === "extracting"),
    );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Source tabs */}
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar border-b border-border/60 flex-shrink-0">
          <button
            onClick={() => setActiveSource("all")}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
              ${
                activeSource === "all"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-white hover:bg-surface"
              }
            `}
          >
            {t("browse.allFonts")}
          </button>
          {FONT_SOURCES.map((src) => (
            <button
              key={src.id}
              onClick={() => setActiveSource(src.id)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
                ${
                  activeSource === src.id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted hover:text-white hover:bg-surface"
                }
              `}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: src.color }}
              />
              {src.label}
              {src.requiresApiKey && (
                <span className="text-[9px] text-amber-400 font-medium">
                  API
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View controls bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
          <span className="text-muted text-xs">
            {fonts.length > 0
              ? t("browse.fontCount", { count: fonts.length })
              : ""}
          </span>
          <ViewControls />
        </div>

        {/* Font Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error state */}
          {loadError && !isLoading && fonts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="text-center">
                <p className="text-white font-semibold">
                  {t("browse.errorLoading")}
                </p>
                <p className="text-muted text-sm mt-1">{loadError}</p>
                {loadError.includes("API") && (
                  <p className="text-amber-400 text-xs mt-2">
                    {t("browse.configureApiKey")}
                  </p>
                )}
              </div>
              <button
                onClick={() => doFetch(1, true)}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw size={14} />
                {t("browse.retry")}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !loadError && fonts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Globe size={48} className="text-muted/30" />
              <div className="text-center">
                <p className="text-white font-semibold">
                  {t("browse.noResults")}
                </p>
                <p className="text-muted text-sm mt-1">
                  {t("browse.noResultsHint")}
                </p>
              </div>
            </div>
          )}

          {/* Font grid / list */}
          {fonts.length > 0 && (
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-2"
                  : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
              }
            >
              {fonts.map((font) => (
                <FontCard
                  key={font.id}
                  font={font}
                  previewText={previewText}
                  onSelect={selectFont}
                  onToggleFavorite={toggleFavorite}
                  onDownload={downloadFont}
                  isDownloading={isDownloading(font.id)}
                  viewMode={viewMode}
                  previewFontSize={previewFontSize}
                />
              ))}

              {/* Loading placeholders */}
              {isLoading &&
                Array.from({ length: viewMode === "list" ? 6 : 12 }).map(
                  (_, i) =>
                    viewMode === "list" ? (
                      <div
                        key={`skeleton-${i}`}
                        className="bg-surface border border-border rounded-xl px-4 py-3 h-[60px] flex items-center gap-4"
                      >
                        <div className="w-7 h-7 bg-border/50 rounded-lg animate-pulse flex-shrink-0" />
                        <div className="flex-1 h-5 bg-border/50 rounded animate-pulse" />
                        <div className="w-32 h-4 bg-border/50 rounded animate-pulse hidden sm:block flex-shrink-0" />
                        <div className="w-24 h-7 bg-border/50 rounded-lg animate-pulse flex-shrink-0" />
                      </div>
                    ) : (
                      <div
                        key={`skeleton-${i}`}
                        className="bg-surface border border-border rounded-xl p-4 space-y-3"
                      >
                        <div className="h-16 bg-border/50 rounded-lg animate-pulse" />
                        <div className="h-3 bg-border/50 rounded animate-pulse w-2/3" />
                        <div className="h-3 bg-border/50 rounded animate-pulse w-1/3" />
                        <div className="h-7 bg-border/50 rounded-lg animate-pulse" />
                      </div>
                    ),
                )}
            </div>
          )}

          {/* Load more */}
          {hasMore && !isLoading && fonts.length > 0 && (
            <div className="flex justify-center mt-8 pb-4">
              <button
                onClick={loadMore}
                className="btn-ghost flex items-center gap-2 border border-border"
              >
                <ChevronDown size={16} />
                {t("browse.loadMore")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Font Preview Panel */}
      {selectedFont && (
        <FontPreview
          font={selectedFont}
          onClose={() => selectFont(null)}
          isDownloading={isDownloading(selectedFont.id)}
        />
      )}
    </div>
  );
};
