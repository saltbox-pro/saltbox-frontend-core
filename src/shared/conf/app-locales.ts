export enum AppLanguage {
  EN = "en",
  RU = "ru",
}

export enum AppLanguageLabel {
  en = "EN",
  ru = "RU",
}

export const DAYJS_LOCALE_MAP: Record<AppLanguage, string> = {
  [AppLanguage.EN]: "en",
  [AppLanguage.RU]: "ru",
};
