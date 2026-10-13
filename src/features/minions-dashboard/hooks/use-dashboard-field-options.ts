import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataCategoriesStore } from "saltbox-core/store";

import {
  type DashboardFieldOption,
  getDashboardFieldOptions,
  getExtraDataDashboardFieldOptions,
} from "../model/dashboard-model";

const EXTRA_DATA_CATEGORIES_PAGE_SIZE = 200;

type DashboardFilterSchema = Parameters<typeof getDashboardFieldOptions>[0];

export const useDashboardFieldOptions = (
  filterSchema: DashboardFilterSchema
): DashboardFieldOption[] => {
  const { i18n } = useTranslation();
  const [categoriesStore] = useState(
    () => new ExtraDataCategoriesStore({ pageSize: EXTRA_DATA_CATEGORIES_PAGE_SIZE })
  );

  useEffect(() => {
    categoriesStore.loadCategories();

    return () => {
      categoriesStore.reset();
    };
  }, [categoriesStore]);

  const { categories } = categoriesStore;

  return useMemo(
    () => [
      ...getDashboardFieldOptions(filterSchema),
      ...getExtraDataDashboardFieldOptions(categories, i18n.language),
    ],
    [filterSchema, categories, i18n.language]
  );
};
