// ============================================================
// SettingsPage — configurações da aplicação
// ============================================================
import React, { useState, useEffect } from "react";
import {
  Key,
  FolderOpen,
  Type,
  Monitor,
  Info,
  Save,
  Eye,
  EyeOff,
  Globe2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppSettings } from "@shared/types";
import { useAppStore } from "../../store/useAppStore";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { bridge } from "../../utils/bridge";

const THEMES = ["dark", "light", "system"] as const;

const PREVIEW_SIZES = [16, 24, 32, 48, 64];

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, saveSettings } = useAppStore();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [fontsDir, setFontsDir] = useState("");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    bridge.system.getFontsDir().then((res) => {
      if (res.success && res.data) setFontsDir(res.data);
    });
  }, []);

  const update = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openFontsDir = () => {
    if (fontsDir) bridge.system.openPath(fontsDir);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-white text-xl font-bold">
            {t("settings.title")}
          </h2>
          <p className="text-muted text-sm mt-1">{t("settings.subtitle")}</p>
        </div>

        {/* Google Fonts API */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-primary" />
            <h3 className="text-white font-semibold">Google Fonts</h3>
          </div>
          <p className="text-muted text-sm">
            {t("settings.googleFonts.description")}{" "}
            <a
              href="https://developers.google.com/fonts/docs/developer_api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                window.api.invoke(
                  "system:openPath",
                  "https://developers.google.com/fonts/docs/developer_api",
                );
              }}
            >
              {t("settings.googleFonts.howToGet")}
            </a>
          </p>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={form.googleFontsApiKey}
              onChange={(e) => update("googleFontsApiKey", e.target.value)}
              placeholder="AIzaSy..."
              className="input-field w-full pr-10 font-mono text-xs"
            />
            <button
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            >
              {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </section>

        {/* Preview Settings */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Type size={16} className="text-primary" />
            <h3 className="text-white font-semibold">
              {t("settings.preview.title")}
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-muted text-xs font-medium block mb-1.5">
                {t("settings.preview.defaultText")}
              </label>
              <input
                type="text"
                value={form.previewText}
                onChange={(e) => update("previewText", e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="text-muted text-xs font-medium block mb-1.5">
                {t("settings.preview.previewSize", { size: form.previewSize })}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={12}
                  max={96}
                  value={form.previewSize}
                  onChange={(e) =>
                    update("previewSize", Number(e.target.value))
                  }
                  className="flex-1 accent-primary h-1.5"
                />
                <div className="flex gap-1">
                  {PREVIEW_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => update("previewSize", s)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        form.previewSize === s
                          ? "bg-primary text-white"
                          : "bg-background text-muted hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-background rounded-xl p-4 min-h-[80px] flex items-center">
              <p
                style={{
                  fontSize: `${form.previewSize}px`,
                  lineHeight: 1.3,
                  color: "#e2e8f0",
                }}
                className="break-words"
              >
                {form.previewText || "Preview de texto..."}
              </p>
            </div>
          </div>
        </section>

        {/* Theme */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-primary" />
            <h3 className="text-white font-semibold">
              {t("settings.appearance.title")}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((id) => (
              <button
                key={id}
                onClick={() => update("theme", id)}
                className={`
                  px-3 py-2.5 rounded-lg text-sm transition-colors border
                  ${
                    form.theme === id
                      ? "bg-primary/20 text-primary border-primary/50"
                      : "bg-background text-muted border-border hover:text-white hover:border-border/80"
                  }
                `}
              >
                {t(`settings.appearance.${id}`)}
              </button>
            ))}
          </div>
        </section>

        {/* Language */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Globe2 size={16} className="text-primary" />
            <h3 className="text-white font-semibold">
              {t("settings.language.title")}
            </h3>
          </div>
          <p className="text-muted text-sm">
            {t("settings.language.description")}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => update("language", lang.code)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-left
                  ${
                    form.language === lang.code
                      ? "bg-primary/20 border-primary/50"
                      : "bg-background border-border hover:border-border/80"
                  }
                `}
              >
                <span
                  className={`text-sm font-medium ${
                    form.language === lang.code ? "text-primary" : "text-white"
                  }`}
                >
                  {lang.nativeLabel}
                </span>
                <span className="text-xs text-muted">{lang.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Font Installation */}
        <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-primary" />
            <h3 className="text-white font-semibold">Instalação de Fontes</h3>
          </div>

          <div>
            <label className="text-muted text-xs font-medium block mb-1.5">
              Modo de instalação
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: "user",
                  label: "👤 Usuário atual",
                  desc: "Sem privilégios de admin",
                },
                {
                  id: "system",
                  label: "🖥️ Sistema",
                  desc: "Requer administrador",
                },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() =>
                    update("fontInstallMode", id as "user" | "system")
                  }
                  className={`
                    p-3 rounded-lg text-left transition-colors border
                    ${
                      form.fontInstallMode === id
                        ? "bg-primary/20 border-primary/50"
                        : "bg-background border-border hover:border-border/80"
                    }
                  `}
                >
                  <span
                    className={`text-sm font-medium ${form.fontInstallMode === id ? "text-primary" : "text-white"}`}
                  >
                    {label}
                  </span>
                  <p className="text-muted text-xs mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2.5">
            <div>
              <p className="text-white text-xs font-medium">Pasta de fontes</p>
              <p className="text-muted text-[10px] mt-0.5 font-mono truncate max-w-xs">
                {fontsDir || "Detectando..."}
              </p>
            </div>
            <button
              onClick={openFontsDir}
              className="btn-ghost text-xs flex items-center gap-1.5 border border-border"
            >
              <FolderOpen size={12} />
              Abrir
            </button>
          </div>
        </section>

        {/* About */}
        <section className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-primary" />
            <h3 className="text-white font-semibold">
              {t("settings.about.title")}
            </h3>
          </div>
          <div className="space-y-1.5 text-xs text-muted">
            <p>{t("settings.about.version", { version: "1.0.0" })}</p>
            <p>{t("settings.about.sources")}</p>
            <p className="text-muted/60">{t("settings.about.description")}</p>
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`btn-primary flex items-center gap-2 min-w-[140px] justify-center ${
              saved ? "bg-success hover:bg-success" : ""
            }`}
          >
            <Save size={14} />
            {saved ? t("settings.saved") : t("settings.save")}
          </button>
        </div>
      </div>
    </div>
  );
};
