import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pt from "./locales/pt.json";

export const LANGS = ["pt", "en"] as const;
export type Lang = (typeof LANGS)[number];

const STORAGE_KEY = "pomodoro:lang";

function savedLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "pt" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "pt";
}

// Strings are still hardcoded in the components for now; keys are being moved
// into the locale files one file at a time. Until a key exists, t("...") just
// returns the key.
void i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: savedLang(),
  fallbackLng: "pt",
  interpolation: { escapeValue: false }, // React already escapes
  react: { useSuspense: false },
});

i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

export default i18n;
