import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ExtraDataCategoriesStore } from "saltbox-core/store";

import {
  type DashboardFieldOption,
  getDashboardFieldOptions,
  getExtraDataDashboardFieldOptions,
} from "../model/dashboard-model";

type DashboardFilterSchema = Parameters<typeof getDashboardFieldOptions>[0];

export const useDashboardFieldOptions = (
  filterSchema: DashboardFilterSchema,
  categoriesStore: ExtraDataCategoriesStore
): { options: DashboardFieldOption[]; isLoading: boolean } => {
  const { i18n } = useTranslation();
  const { categories, isLoading } = categoriesStore;

  const options = useMemo(
    () => [
      ...getDashboardFieldOptions(filterSchema),
      ...getExtraDataDashboardFieldOptions(categories, i18n.language),
    ],
    [filterSchema, categories, i18n.language]
  );

  return { options, isLoading };
};
