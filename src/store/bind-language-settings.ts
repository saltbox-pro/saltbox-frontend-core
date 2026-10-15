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
  setPersister: (persist: ((locale: AppLanguage) => Promise<void>) | null) => void;
  applyLocale: (locale: AppLanguage) => void;
};

export function bindLanguageSettings(
  authStore: AuthStoreWithAccessToken,
  localeStore: LocaleStoreWithPersister
): () => void {
  let isCancelled = false;

  localeStore.setPersister(async (locale) => {
    const previousLanguage = getLanguageSetting();
    setLanguageSetting(locale);

    try {
      await flushUserSettings();
    } catch (error) {
      setLanguageSetting(previousLanguage);
      throw error;
    }
  });

  const disposer = reaction(
    () => authStore.user?.access_token ?? null,
    (accessToken) => {
      if (!accessToken) {
        return;
      }

      ensureUserSettingsLoaded()
        .then(() => {
          if (isCancelled) {
            return;
          }

          const language = getLanguageSetting();
          if (!language) {
            return;
          }

          localeStore.applyLocale(language);
        })
        .catch((error: unknown) => {
          console.error("Failed to apply the language from user settings", error);
        });
    },
    { fireImmediately: true }
  );

  return () => {
    isCancelled = true;
    disposer();
    localeStore.setPersister(null);
  };
}
