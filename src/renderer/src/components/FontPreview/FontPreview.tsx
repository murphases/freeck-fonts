// ============================================================
// FontPreview — painel lateral de previsualização detalhada
// ============================================================
import React, { useState } from "react";
import {
  X,
  Download,
  Check,
  Heart,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { Font } from "@shared/types";
import { useFontPreview } from "../../hooks/useFontPreview";
import { useAppStore } from "../../store/useAppStore";
import { useFontStore } from "../../store/useFontStore";
import { bridge } from "../../utils/bridge";

const PREVIEW_SIZES = [16, 24, 32, 48, 64, 96];
const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog",
  "Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm",
  "0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( )",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
];

interface FontPreviewProps {
  font: Font;
  onClose: () => void;
  isDownloading?: boolean;
}

export const FontPreview: React.FC<FontPreviewProps> = ({
  font,
  onClose,
  isDownloading,
}) => {
  const [customText, setCustomText] = useState("");
  const [size, setSize] = useState(48);
  const [showVariants, setShowVariants] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const previewText = useAppStore((s) => s.previewText);
  const toggleFavorite = useFontStore((s) => s.toggleFavorite);
  const downloadFont = useFontStore((s) => s.downloadFont);
  const uninstallFont = useFontStore((s) => s.uninstallFont);

  const displayText = customText || previewText;

  // Load all variants
  const { loaded: mainLoaded, fontFaceId } = useFontPreview(font, size);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadFont(font);
    setDownloading(false);
  };

  const handleUninstall = async () => {
    if (confirm(`Desinstalar "${font.name}"?`)) {
      await uninstallFont(font);
    }
  };

  return (
    <aside className="w-[380px] flex-shrink-0 bg-background-secondary border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-white font-semibold text-base truncate">
            {font.name}
          </h2>
          <p className="text-muted text-xs truncate">{font.family}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-surface rounded-lg text-muted hover:text-white transition-colors flex-shrink-0 ml-2"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main preview area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Controls */}
        <div className="space-y-2">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={previewText}
            rows={2}
            className="input-field w-full resize-none text-xs"
          />

          {/* Size slider */}
          <div className="flex items-center gap-3">
            <span className="text-muted text-xs w-12">{size}px</span>
            <input
              type="range"
              min={12}
              max={120}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="flex-1 accent-primary h-1.5"
            />
            <button
              onClick={() => setSize(48)}
              className="text-muted hover:text-white transition-colors"
              title="Resetar tamanho"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Quick sizes */}
          <div className="flex gap-1.5 flex-wrap">
            {PREVIEW_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  size === s
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:text-white hover:bg-surface-hover"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-surface rounded-xl p-5 min-h-[120px] flex items-center">
          {mainLoaded ? (
            <p
              style={{
                fontFamily: `"${fontFaceId}", "${font.family}", sans-serif`,
                fontSize: `${size}px`,
                lineHeight: 1.3,
                color: "#e2e8f0",
                wordBreak: "break-word",
              }}
            >
              {displayText}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-muted text-sm">
              <Loader2 size={16} className="animate-spin" />
              <span>Carregando fonte...</span>
            </div>
          )}
        </div>

        {/* Sample texts */}
        <div className="space-y-2">
          <p className="text-muted text-xs font-medium uppercase tracking-wider">
            Exemplos
          </p>
          <div className="space-y-2">
            {SAMPLE_TEXTS.map((text, i) => (
              <button
                key={i}
                onClick={() => setCustomText(text)}
                className="w-full text-left p-2 rounded-lg text-xs text-muted hover:text-white hover:bg-surface transition-colors truncate"
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Variants */}
        {font.variants.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowVariants((v) => !v)}
              className="flex items-center justify-between w-full text-muted text-xs font-medium uppercase tracking-wider hover:text-white transition-colors"
            >
              <span>Variantes ({font.variants.length})</span>
              {showVariants ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>

            {showVariants && (
              <div className="grid grid-cols-2 gap-1.5">
                {font.variants.map((v, i) => (
                  <div
                    key={i}
                    className="bg-surface rounded-lg px-2 py-1.5 text-xs text-center"
                  >
                    <span
                      style={{
                        fontFamily: `"${fontFaceId}", "${font.family}"`,
                        fontWeight: v.weight,
                        fontStyle: v.style,
                      }}
                      className="text-white text-sm block mb-0.5"
                    >
                      Aa
                    </span>
                    <span className="text-muted">
                      {v.weight} {v.style === "italic" ? "Italic" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          <p className="text-muted text-xs font-medium uppercase tracking-wider">
            Informações
          </p>
          <div className="space-y-1.5 text-xs">
            {font.category && (
              <div className="flex justify-between">
                <span className="text-muted">Categoria</span>
                <span className="text-white capitalize">{font.category}</span>
              </div>
            )}
            {font.license && (
              <div className="flex justify-between">
                <span className="text-muted">Licença</span>
                <span className="text-white uppercase">
                  {font.license.replace("-", " ")}
                </span>
              </div>
            )}
            {font.designer && (
              <div className="flex justify-between">
                <span className="text-muted">Designer</span>
                <span className="text-white truncate max-w-[180px]">
                  {font.designer}
                </span>
              </div>
            )}
            {font.source && (
              <div className="flex justify-between">
                <span className="text-muted">Origem</span>
                <a
                  href={font.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    window.electron.shell.openExternal(font.sourceUrl);
                  }}
                >
                  {font.source.replace("-", " ")}
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="border-t border-border p-4 space-y-2">
        <button
          onClick={() => toggleFavorite(font)}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              font.isFavorite
                ? "bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                : "bg-surface hover:bg-surface-hover text-muted hover:text-white"
            }
          `}
        >
          <Heart size={14} fill={font.isFavorite ? "currentColor" : "none"} />
          {font.isFavorite ? "Favorita" : "Adicionar Favorita"}
        </button>

        {font.isInstalled ? (
          <button
            onClick={handleUninstall}
            className="w-full btn-danger flex items-center justify-center gap-2"
          >
            <X size={14} />
            Desinstalar
          </button>
        ) : (
          <button
            onClick={handleDownload}
            disabled={downloading || isDownloading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {downloading || isDownloading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Baixando...
              </>
            ) : (
              <>
                <Download size={14} /> Baixar e Instalar
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
