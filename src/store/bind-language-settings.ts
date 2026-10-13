import {
  type AppLanguage,
  type AuthStoreWithAccessToken,
  ensureUserSettingsLoaded,
  flushUserSettings,
  getLanguageSetting,
  setLanguageSetting,
} from "@saltbox/saltbox-frontend-common";
import { reaction } from "mobx";

export type LocaleStoreWithPersister = {
  currentLocale: AppLanguage;
  setPersister: (persist: (locale: AppLanguage) => Promise<void>) => void;
  setLocale: (locale: AppLanguage) => void | Promise<void>;
};

export function bindLanguageSettings(
  authStore: AuthStoreWithAccessToken,
  localeStore: LocaleStoreWithPersister
): () => void {
  localeStore.setPersister(async (locale) => {
    setLanguageSetting(locale);
    await flushUserSettings();
  });

  const disposer = reaction(
    () => authStore.user?.access_token ?? null,
    (accessToken) => {
      if (!accessToken) {
        return;
      }

      ensureUserSettingsLoaded()
        .then(() => {
          const language = getLanguageSetting();
          if (!language) {
            return;
          }

          localeStore.setLocale(language);
        })
        .catch(() => undefined);
    },
    { fireImmediately: true }
  );

  return () => {
    disposer();
  };
}
