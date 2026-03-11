// ============================================================
// FilterPanel — painel de filtros lateral (fonte, categoria, licença)
// ============================================================
import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  FontCategory,
  FontLicense,
  FontSource,
  FONT_SOURCES,
} from "@shared/types";
import { useFontStore } from "../../store/useFontStore";

const CATEGORIES: { id: FontCategory; labelKey: string }[] = [
  { id: "serif", labelKey: "Serif" },
  { id: "sans-serif", labelKey: "Sans-serif" },
  { id: "monospace", labelKey: "Monospace" },
  { id: "display", labelKey: "Display" },
  { id: "handwriting", labelKey: "Handwriting" },
  { id: "other", labelKey: "filters.other" },
];

const LICENSES: { id: FontLicense; label: string }[] = [
  { id: "ofl", label: "OFL (Open Font License)" },
  { id: "apache", label: "Apache" },
  { id: "mit", label: "MIT" },
  { id: "free-commercial", label: "Free Commercial" },
  { id: "public-domain", label: "Public Domain" },
];

const SORT_VALUES = [
  "popularity:desc",
  "name:asc",
  "name:desc",
  "newest:desc",
] as const;

interface FilterPanelProps {
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const filter = useFontStore((s) => s.filter);
  const setFilter = useFontStore((s) => s.setFilter);

  const toggleSource = (id: FontSource) => {
    const current = filter.sources || [];
    const updated = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    setFilter({ sources: updated.length ? updated : undefined });
  };

  const toggleCategory = (id: FontCategory) => {
    const current = filter.categories || [];
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    setFilter({ categories: updated.length ? updated : undefined });
  };

  const toggleLicense = (id: FontLicense) => {
    const current = filter.licenses || [];
    const updated = current.includes(id)
      ? current.filter((l) => l !== id)
      : [...current, id];
    setFilter({ licenses: updated.length ? updated : undefined });
  };

  const handleSort = (value: string) => {
    const [sortBy, sortOrder] = value.split(":") as [
      "name" | "popularity" | "newest",
      "asc" | "desc",
    ];
    setFilter({ sortBy, sortOrder });
  };

  const clearAll = () => {
    setFilter({
      sources: undefined,
      categories: undefined,
      licenses: undefined,
      sortBy: "popularity",
      sortOrder: "desc",
    });
  };

  const currentSort = `${filter.sortBy || "popularity"}:${filter.sortOrder || "desc"}`;
  const hasFilters =
    (filter.sources?.length || 0) > 0 ||
    (filter.categories?.length || 0) > 0 ||
    (filter.licenses?.length || 0) > 0;

  return (
    <aside className="w-64 flex-shrink-0 bg-background-secondary border-r border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-white font-semibold text-sm">
          {t("filters.title")}
        </span>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-primary text-xs hover:underline"
            >
              {t("filters.clear")}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Sort */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">
            {t("filters.sort")}
          </p>
          <select
            value={currentSort}
            onChange={(e) => handleSort(e.target.value)}
            className="input-field w-full text-xs"
          >
            {SORT_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`filters.sortOptions.${v}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Sources */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">
            {t("filters.sources")}
          </p>
          <div className="space-y-1.5">
            {FONT_SOURCES.map((source) => {
              const active = filter.sources?.includes(source.id);
              return (
                <button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2
                    ${
                      active
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted hover:text-white hover:bg-surface"
                    }
                  `}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="flex-1">{source.label}</span>
                  {source.requiresApiKey && (
                    <span className="text-[9px] text-amber-400 font-medium">
                      API
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">
            {t("filters.categories")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map(({ id, labelKey }) => {
              const active = filter.categories?.includes(id);
              const label = labelKey.startsWith("filters.")
                ? t(labelKey)
                : labelKey;
              return (
                <button
                  key={id}
                  onClick={() => toggleCategory(id)}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-xs transition-colors text-center
                    ${
                      active
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-surface text-muted hover:text-white hover:bg-surface-hover"
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Licenses */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">
            {t("filters.licenses")}
          </p>
          <div className="space-y-1.5">
            {LICENSES.map(({ id, label }) => {
              const active = filter.licenses?.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleLicense(id)}
                  className={`
                    w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors
                    ${
                      active
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted hover:text-white hover:bg-surface"
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick filters */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">
            {t("filters.show")}
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() =>
                setFilter({ showInstalled: !filter.showInstalled })
              }
              className={`
                w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2
                ${
                  filter.showInstalled
                    ? "bg-success/20 text-success border border-success/30"
                    : "text-muted hover:text-white hover:bg-surface"
                }
              `}
            >
              <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
              {t("filters.onlyInstalled")}
            </button>
            <button
              onClick={() =>
                setFilter({ showFavorites: !filter.showFavorites })
              }
              className={`
                w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2
                ${
                  filter.showFavorites
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                    : "text-muted hover:text-white hover:bg-surface"
                }
              `}
            >
              <span className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0" />
              {t("filters.onlyFavorites")}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
