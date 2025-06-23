import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { AppLanguage, AppLanguageLabel } from "@packages/conf/app-locales";
import { setDateTimeLocale } from "@packages/utils/datetime";

class I18NStore {
  readonly supportedLanguages: Array<AppLanguage> = [
    AppLanguage.EN,
    AppLanguage.RU,
  ];

  constructor() {
    i18n
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: AppLanguage.EN,
        ns: ["base"],
        defaultNS: "base",
        debug: false,
        detection: {
          order: ["localStorage", "navigator"],
          caches: ["localStorage"],
        },
        interpolation: {
          escapeValue: false,
        },
        supportedLngs: this.supportedLanguages,
        backend: {
          loadPath: "http://localhost:8002/locales/{{lng}}/{{ns}}.json",
          allowMultiLoading: true,
        },
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

  get currentLanguageLabel(): AppLanguageLabel {
    return this.getLanguageLabel(i18n.language);
  }

  getLanguageLabel = (language: AppLanguage | string): AppLanguageLabel => {
    return AppLanguageLabel[language as keyof typeof AppLanguageLabel];
  };
}

export const i18nStore = new I18NStore();
