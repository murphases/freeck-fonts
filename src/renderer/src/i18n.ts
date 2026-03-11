// ============================================================
// i18n — configuração central de internacionalização
//
// ➕ Como adicionar um novo idioma:
//   1. Crie: src/renderer/src/locales/{locale}/translation.json
//      Copie en-US/translation.json como base e traduza os valores.
//   2. Importe o JSON aqui (linha marcada com "PASSO 2").
//   3. Adicione uma entrada em SUPPORTED_LANGUAGES (linha "PASSO 3").
//   4. Registre o recurso em i18n.init() → resources (linha "PASSO 4").
//   Pronto! O idioma aparecerá automaticamente no Onboarding e nas Configurações.
// ============================================================
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Importações dos arquivos de tradução
import enUS from "./locales/en-US/translation.json";
import ptBR from "./locales/pt-BR/translation.json";
// PASSO 2 — importe novos idiomas aqui:
// import esES from "./locales/es-ES/translation.json";
// import frFR from "./locales/fr-FR/translation.json";

// -------------------------------------------------------
// Lista de idiomas suportados — usada na UI de seleção
// -------------------------------------------------------
export interface SupportedLanguage {
  /** Código IETF (ex: "pt-BR", "en-US") — deve bater com a chave em resources */
  code: string;
  /** Nome em inglês */
  label: string;
  /** Nome no próprio idioma */
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: "pt-BR",
    label: "Portuguese (Brazil)",
    nativeLabel: "Português (Brasil)",
  },
  { code: "en-US", label: "English (US)", nativeLabel: "English (US)" },
  // PASSO 3 — adicione novos idiomas aqui:
  // { code: "es-ES", label: "Spanish (Spain)",  nativeLabel: "Español (España)" },
  // { code: "fr-FR", label: "French (France)",  nativeLabel: "Français (France)" },
];

// -------------------------------------------------------
// Inicialização do i18next
// -------------------------------------------------------
i18n.use(initReactI18next).init({
  resources: {
    "en-US": { translation: enUS },
    "pt-BR": { translation: ptBR },
    // PASSO 4 — registre novos recursos aqui:
    // "es-ES": { translation: esES },
    // "fr-FR": { translation: frFR },
  },
  // Idioma inicial: será sobrescrito por useAppStore.loadSettings()
  lng: "en-US",
  fallbackLng: "en-US",
  interpolation: {
    // React já faz escape de HTML — não precisamos fazer aqui
    escapeValue: false,
  },
});

export default i18n;
