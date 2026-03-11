// ============================================================
// Header — barra superior com busca e controles globais
// ============================================================
import React, { useState } from "react";
import { Search, X, SlidersHorizontal, ArrowUpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "../../hooks/useDebounce";
import { useAppStore } from "../../store/useAppStore";
import { useFontStore } from "../../store/useFontStore";
import { useUpdateStore } from "../../store/useUpdateStore";

interface HeaderProps {
  onToggleFilters: () => void;
  filtersOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleFilters,
  filtersOpen,
}) => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const currentPage = useAppStore((s) => s.currentPage);
  const previewText = useAppStore((s) => s.previewText);
  const setPreviewText = useAppStore((s) => s.setPreviewText);
  const setFilter = useFontStore((s) => s.setFilter);

  const updateDeferred = useUpdateStore((s) => s.deferred);
  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const openUpdateDialog = useUpdateStore((s) => s.openDialog);
  const updatePhase = useUpdateStore((s) => s.phase);

  React.useEffect(() => {
    setFilter({ search: debouncedSearch });
  }, [debouncedSearch]);

  const clearSearch = () => {
    setSearchInput("");
    setFilter({ search: "" });
  };

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background flex-shrink-0">
      {/* Page title */}
      <h2 className="text-white font-semibold text-base w-40 flex-shrink-0 hidden sm:block">
        {t(`header.pageTitles.${currentPage}`, "FreeckFonts")}
      </h2>

      {/* Search bar */}
      {currentPage !== "settings" && (
        <div className="flex-1 relative max-w-xl">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("header.searchPlaceholder")}
            className="input-field w-full pl-8 pr-8"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Preview text input */}
      {currentPage !== "settings" && (
        <div className="relative hidden lg:block">
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder={t("header.previewPlaceholder")}
            className="input-field text-xs w-52"
          />
        </div>
      )}

      {/* Filter toggle */}
      {currentPage === "browse" && (
        <button
          onClick={onToggleFilters}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors flex-shrink-0
            ${
              filtersOpen
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-surface text-muted hover:text-white hover:bg-surface-hover border border-border"
            }
          `}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">{t("header.filters")}</span>
        </button>
      )}

      {/* Badge de atualização — aparece quando o usuário adiou */}
      {updateDeferred && updateInfo && updatePhase !== "idle" && (
        <button
          onClick={openUpdateDialog}
          title={t("update.badge", { version: updateInfo.version })}
          className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors flex-shrink-0 border border-amber-500/30"
        >
          <ArrowUpCircle size={15} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        </button>
      )}
    </header>
  );
};
