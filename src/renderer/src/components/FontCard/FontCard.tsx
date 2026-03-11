// ============================================================
// FontCard — card de exibição de fonte com preview e ações
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { Heart, Download, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Font, FontSource } from "@shared/types";
import { useFontPreview } from "../../hooks/useFontPreview";

interface FontCardProps {
  font: Font;
  previewText: string;
  onSelect: (font: Font) => void;
  onToggleFavorite: (font: Font) => void;
  onDownload: (font: Font) => void;
  isDownloading?: boolean;
  viewMode?: "grid" | "list";
  previewFontSize?: number;
}

const SOURCE_COLORS: Record<FontSource | "local", string> = {
  "google-fonts": "badge-google-fonts",
  "font-squirrel": "badge-font-squirrel",
  fontspace: "badge-fontspace",
  "1001-fonts": "badge-1001-fonts",
  "font-library": "badge-font-library",
  "open-foundry": "badge-open-foundry",
  local: "badge-local",
};

const SOURCE_LABELS: Record<FontSource | "local", string> = {
  "google-fonts": "Google",
  "font-squirrel": "Squirrel",
  fontspace: "FontSpace",
  "1001-fonts": "1001",
  "font-library": "Library",
  "open-foundry": "Open Foundry",
  local: "Local",
};

export const FontCard: React.FC<FontCardProps> = ({
  font,
  previewText,
  onSelect,
  onToggleFavorite,
  onDownload,
  isDownloading = false,
  viewMode = "grid",
  previewFontSize = 28,
}) => {
  const { t } = useTranslation();
  const { loaded, fontFaceId } = useFontPreview(font);
  const [imgError, setImgError] = useState(false);

  // Resetar erro de imagem quando a fonte mudar
  useEffect(() => {
    setImgError(false);
  }, [font.id]);

  const displayText = previewText.slice(0, 36) || font.name;

  // Bloco de pré-visualização unificado:
  // 1. previewImageUrl → imagem estática do site de origem (scraping)
  // 2. loaded + fontFaceId → texto renderizado com FontFace (Google Fonts / instaladas)
  // 3. skeleton enquanto carrega
  const previewBlock = (isListMode: boolean) => {
    if (font.previewImageUrl && !imgError) {
      // Todos os scrapers geram imagens com texto escuro em fundo claro.
      // Invertemos via CSS para exibir corretamente no dark mode.
      const needsInvert =
        font.source === "font-squirrel" ||
        font.source === "fontspace" ||
        font.source === "1001-fonts" ||
        font.source === "font-library" ||
        font.source === "open-foundry";
      return (
        <img
          src={font.previewImageUrl}
          alt={font.name}
          loading="lazy"
          style={
            needsInvert ? { filter: "invert(1) brightness(0.9)" } : undefined
          }
          className={
            isListMode
              ? "h-8 w-auto max-w-[240px] object-contain object-left"
              : "w-full h-16 object-contain object-left"
          }
          onError={() => setImgError(true)}
        />
      );
    }
    if (loaded) {
      return (
        <p
          style={{
            fontFamily: `"${fontFaceId}", "${font.family}", sans-serif`,
            fontSize: `${previewFontSize}px`,
            lineHeight: 1.1,
            color: "#e2e8f0",
          }}
          className={isListMode ? "truncate w-full" : "truncate-2 w-full"}
        >
          {displayText}
        </p>
      );
    }
    // Skeleton
    return isListMode ? (
      <div className="h-5 bg-border/50 rounded animate-pulse w-48" />
    ) : (
      <div className="w-full space-y-1.5">
        <div className="h-5 bg-border/50 rounded animate-pulse w-3/4" />
        <div className="h-5 bg-border/50 rounded animate-pulse w-1/2" />
      </div>
    );
  };

  const heartBtn = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(font);
      }}
      className={`p-1.5 rounded-lg transition-colors ${
        font.isFavorite
          ? "text-pink-400 bg-pink-400/10 hover:bg-pink-400/20"
          : "text-muted hover:text-pink-400 hover:bg-pink-400/10"
      }`}
      title={
        font.isFavorite
          ? t("fontCard.removeFavorite")
          : t("fontCard.addFavorite")
      }
    >
      <Heart size={14} fill={font.isFavorite ? "currentColor" : "none"} />
    </button>
  );

  const installBtn = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!font.isInstalled && !isDownloading) onDownload(font);
      }}
      disabled={font.isInstalled || isDownloading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        transition-colors disabled:cursor-not-allowed ${
          font.isInstalled
            ? "bg-success/20 text-success"
            : isDownloading
              ? "bg-primary/20 text-primary"
              : "bg-primary hover:bg-primary/90 text-white"
        }`}
    >
      {font.isInstalled ? (
        <>
          <Check size={11} /> {t("fontCard.installed")}
        </>
      ) : isDownloading ? (
        <>
          <Loader2 size={11} className="animate-spin" />{" "}
          {t("fontCard.downloading")}
        </>
      ) : (
        <>
          <Download size={11} /> {t("fontCard.install")}
        </>
      )}
    </button>
  );

  /* ── List mode ─────────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-3 cursor-pointer font-card-hover select-none animate-fade-in relative overflow-hidden"
        onClick={() => onSelect(font)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect(font)}
      >
        {/* Heart */}
        <div className="flex-shrink-0">{heartBtn}</div>

        {/* Preview text */}
        <div className="flex-1 min-w-0 overflow-hidden flex items-center h-10">
          {previewBlock(true)}
        </div>

        {/* Font info */}
        <div className="w-44 flex-shrink-0 hidden sm:block">
          <h3 className="text-white font-semibold text-sm truncate">
            {font.name}
          </h3>
          <p className="text-muted text-xs mt-0.5 truncate">
            {t("fontCard.variant", { count: font.variants.length })}
            {font.designer && ` · ${font.designer}`}
          </p>
        </div>

        {/* Badges */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              SOURCE_COLORS[font.source] || "badge-local"
            }`}
          >
            {SOURCE_LABELS[font.source] || font.source}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-border/60 text-muted capitalize">
            {font.category}
          </span>
        </div>

        {/* Install */}
        <div className="flex-shrink-0">{installBtn}</div>

        {font.isInstalled && (
          <span className="absolute top-1.5 right-1.5 bg-success/20 text-success rounded-full p-0.5">
            <Check size={9} />
          </span>
        )}
      </div>
    );
  }

  /* ── Grid mode (padrão) ────────────────────────────────── */
  return (
    <div
      className="
        bg-surface border border-border rounded-xl p-4 cursor-pointer
        font-card-hover flex flex-col gap-3 select-none animate-fade-in
        group relative overflow-hidden
      "
      onClick={() => onSelect(font)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(font)}
    >
      {/* Installed indicator */}
      {font.isInstalled && (
        <span className="absolute top-2 right-2 bg-success/20 text-success rounded-full p-0.5">
          <Check size={10} />
        </span>
      )}

      {/* Font Preview */}
      <div className="h-16 flex items-center justify-start overflow-hidden">
        {previewBlock(false)}
      </div>

      {/* Font Info */}
      <div>
        <h3 className="text-white font-semibold text-sm truncate">
          {font.name}
        </h3>
        <p className="text-muted text-xs mt-0.5">
          {t("fontCard.variant", { count: font.variants.length })}
          {font.designer && ` · ${font.designer}`}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`
            text-[10px] font-medium px-2 py-0.5 rounded-full
            ${SOURCE_COLORS[font.source] || "badge-local"}
          `}
        >
          {SOURCE_LABELS[font.source] || font.source}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-border/60 text-muted capitalize">
          {font.category}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto pt-1">
        {heartBtn}
        {installBtn}
      </div>
    </div>
  );
};
