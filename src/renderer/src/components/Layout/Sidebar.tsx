// ============================================================
// Sidebar — navegação lateral da aplicação
// ============================================================
import React from "react";
import {
  Globe,
  HardDrive,
  Heart,
  Settings,
  Download,
  Layers,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";
import { useDownloadStore } from "../../store/useDownloadStore";
import { useFontStore } from "../../store/useFontStore";

type Page = "browse" | "installed" | "favorites" | "settings";

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);
  const setPanelOpen = useDownloadStore((s) => s.setPanelOpen);
  const panelOpen = useDownloadStore((s) => s.panelOpen);
  const activeTasks = useDownloadStore((s) =>
    s.tasks.filter(
      (t) => t.status === "downloading" || t.status === "installing",
    ),
  );
  const installedCount = useFontStore((s) => s.installedFonts.length);
  const favoriteCount = useFontStore((s) => s.favoriteFonts.length);

  const navItems: { id: Page; labelKey: string; icon: React.ElementType }[] = [
    { id: "browse", labelKey: "nav.browse", icon: Globe },
    { id: "installed", labelKey: "nav.installed", icon: HardDrive },
    { id: "favorites", labelKey: "nav.favorites", icon: Heart },
    { id: "settings", labelKey: "nav.settings", icon: Settings },
  ];

  const getBadge = (id: Page): number | undefined => {
    if (id === "installed") return installedCount || undefined;
    if (id === "favorites") return favoriteCount || undefined;
    return undefined;
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-background-secondary border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-none">
              FreeckFonts
            </h1>
            <p className="text-muted text-[10px] mt-0.5">{t("app.tagline")}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ id, labelKey, icon: Icon }) => {
          const badge = getBadge(id);
          const isActive = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-colors text-left
                ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted hover:text-white hover:bg-surface"
                }
              `}
            >
              <Icon size={16} />
              <span className="flex-1">{t(labelKey)}</span>
              {badge !== undefined && (
                <span
                  className={`
                    text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                    ${isActive ? "bg-primary/30 text-primary" : "bg-surface text-muted"}
                  `}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Downloads shortcut */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
            ${panelOpen ? "bg-primary/20 text-primary" : "text-muted hover:text-white hover:bg-surface"}
          `}
        >
          <Download size={16} />
          <span className="flex-1">{t("nav.downloads")}</span>
          {activeTasks.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] text-primary font-medium">
                {activeTasks.length}
              </span>
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
