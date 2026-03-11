// ============================================================
// App.tsx — raiz da aplicação, orquestra layout e rotas
// ============================================================
import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { FilterPanel } from "./components/FilterPanel/FilterPanel";
import { DownloadPanel } from "./components/DownloadPanel/DownloadPanel";
import { UpdateDialog } from "./components/UpdateDialog/UpdateDialog";
import { BrowsePage } from "./pages/Browse/BrowsePage";
import { InstalledPage } from "./pages/Installed/InstalledPage";
import { FavoritesPage } from "./pages/Favorites/FavoritesPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { OnboardingPage } from "./pages/Onboarding/OnboardingPage";
import { useAppStore } from "./store/useAppStore";
import { useFontStore } from "./store/useFontStore";
import { initDownloadEvents } from "./store/useDownloadStore";
import { useUpdater } from "./hooks/useUpdater";

function App(): JSX.Element {
  const currentPage = useAppStore((s) => s.currentPage);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const settings = useAppStore((s) => s.settings);
  const settingsLoaded = useAppStore((s) => s.settingsLoaded);
  const fetchInstalled = useFontStore((s) => s.fetchInstalled);
  const fetchFavorites = useFontStore((s) => s.fetchFavorites);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Subscreve eventos IPC de atualização
  useUpdater();

  // Initialize on mount
  useEffect(() => {
    loadSettings();
    fetchInstalled();
    fetchFavorites();
    const cleanup = initDownloadEvents();
    return cleanup;
  }, []);

  // Aguarda carregamento das configurações para evitar flash
  if (!settingsLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Primeira execução: language vazio → exibe seletor de idioma
  if (!settings.language) {
    return <OnboardingPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-white">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <Header
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          filtersOpen={filtersOpen}
        />

        {/* Content area with optional filter panel */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Filters (only on Browse page) */}
          {filtersOpen && currentPage === "browse" && (
            <FilterPanel onClose={() => setFiltersOpen(false)} />
          )}

          {/* Page content */}
          {currentPage === "browse" && <BrowsePage />}
          {currentPage === "installed" && <InstalledPage />}
          {currentPage === "favorites" && <FavoritesPage />}
          {currentPage === "settings" && <SettingsPage />}

          {/* Download progress panel (floating) */}
          <div className="absolute bottom-4 right-4 z-50">
            <DownloadPanel />
          </div>
        </div>
      </div>

      {/* Modal de atualização */}
      <UpdateDialog />
    </div>
  );
}

export default App;
