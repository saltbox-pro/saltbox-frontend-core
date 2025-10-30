import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { setDateTimeLocale, AppLanguage, enCommon, ruCommon } from "@saltbox/saltbox-frontend-common";

import enBase from "../locales/en/base.json";
import ruBase from "../locales/ru/base.json";

const resources = {
  [AppLanguage.EN]: {
    base: enBase,
    common: enCommon,
  },
  [AppLanguage.RU]: {
    base: ruBase,
    common: ruCommon,
  },
};

class I18NStore {
  readonly supportedLanguages: Array<AppLanguage> = [
    AppLanguage.EN,
    AppLanguage.RU,
  ];

  constructor() {
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: AppLanguage.EN,
        ns: ["base", "common"],
        defaultNS: "base",
        debug: false,
        resources,
        detection: {
          order: ["localStorage", "navigator"],
          caches: ["localStorage"],
        },
        interpolation: {
          escapeValue: false,
        },
        supportedLngs: this.supportedLanguages,
        react: {
          useSuspense: true,
        },
      });

    setDateTimeLocale(this.currentLanguage);

    i18n.on("languageChanged", (lng: string) => {
      setDateTimeLocale(lng as AppLanguage);
    });
  }

  get currentLanguage(): AppLanguage {
    return i18n.language as AppLanguage;
  }

  set currentLanguage(language: AppLanguage) {
    i18n.changeLanguage(language);
  }
}

export const i18nStore = new I18NStore();
