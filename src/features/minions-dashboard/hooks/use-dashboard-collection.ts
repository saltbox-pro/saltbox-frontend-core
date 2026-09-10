import { useLayoutEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { dashboardStore } from "../model/dashboard-store";

export const useDashboardCollection = (collectionSlug: string | undefined) => {
  const { t } = useTranslation();

  const tabNames = useMemo(
    () => ({
      firstTab: t("dashboard.first-tab-name"),
      newTab: t("dashboard.new-tab-name"),
    }),
    [t]
  );

  useLayoutEffect(() => {
    dashboardStore.setCollection(collectionSlug ?? null, tabNames);
  }, [collectionSlug, tabNames]);
};
