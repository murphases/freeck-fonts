// ============================================================
// OnboardingPage — seleção de idioma na primeira execução
// ============================================================
import React, { useState } from "react";
import { Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";

export const OnboardingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, saveSettings } = useAppStore();

  // Pré-seleciona o idioma do sistema se suportado, senão en-US
  const systemLocale =
    typeof navigator !== "undefined" ? navigator.language : "en-US";
  const defaultCode =
    SUPPORTED_LANGUAGES.find((l) =>
      systemLocale.startsWith(l.code.split("-")[0]),
    )?.code ?? "en-US";

  const [selected, setSelected] = useState<string>(defaultCode);

  const handleSelect = (code: string) => {
    setSelected(code);
    // Preview imediato do idioma selecionado na própria tela de onboarding
    i18n.changeLanguage(code);
  };

  const handleContinue = async () => {
    await saveSettings({ ...settings, language: selected });
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full px-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Layers size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">
              {t("onboarding.welcome")}
            </h1>
            <p className="text-muted text-sm mt-1">
              {t("onboarding.subtitle")}
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="w-full">
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-3 text-center">
            {t("onboarding.chooseLanguage")}
          </p>
          <div className="space-y-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`
                  w-full flex items-center justify-between px-4 py-3.5 rounded-xl border
                  transition-all text-left
                  ${
                    selected === lang.code
                      ? "bg-primary/20 border-primary/60 text-primary shadow-sm shadow-primary/20"
                      : "bg-surface border-border text-white hover:border-border/80 hover:bg-surface-hover"
                  }
                `}
              >
                <span className="font-semibold text-sm">
                  {lang.nativeLabel}
                </span>
                <span className="text-xs text-muted">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Continue */}
        <button
          onClick={handleContinue}
          className="btn-primary w-full py-3 text-sm font-semibold"
        >
          {t("onboarding.continue")} →
        </button>
      </div>
    </div>
  );
};
