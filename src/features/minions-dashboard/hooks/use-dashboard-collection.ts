import { AppLanguage } from "@saltbox/saltbox-frontend-common";
import { useLayoutEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { dashboardStore } from "../model/dashboard-store";

export const useDashboardCollection = (collectionSlug: string | undefined) => {
  const { t, i18n } = useTranslation();

  const tabNames = useMemo(
    () => ({
      firstTab: t("dashboard.first-tab-name"),
      newTab: t("dashboard.new-tab-name"),
      firstTabAliases: Object.values(AppLanguage).map((language) =>
        i18n.getFixedT(language)("dashboard.first-tab-name")
      ),
    }),
    [t, i18n]
  );

  useLayoutEffect(() => {
    dashboardStore.setCollection(collectionSlug ?? null, tabNames);
  }, [collectionSlug, tabNames]);
};
