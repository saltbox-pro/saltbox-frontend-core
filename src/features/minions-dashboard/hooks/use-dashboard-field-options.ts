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

type UseDashboardFieldOptionsParams = {
  isActive?: boolean;
  isModalOpen?: boolean;
};

export const useDashboardFieldOptions = (
  filterSchema: DashboardFilterSchema,
  { isActive = true, isModalOpen = false }: UseDashboardFieldOptionsParams = {}
): { options: DashboardFieldOption[]; isLoading: boolean } => {
  const { i18n } = useTranslation();
  const [categoriesStore] = useState(
    () => new ExtraDataCategoriesStore({ pageSize: EXTRA_DATA_CATEGORIES_PAGE_SIZE })
  );

  useEffect(() => {
    return () => {
      categoriesStore.reset();
    };
  }, [categoriesStore]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    categoriesStore.loadCategories();
  }, [categoriesStore, isActive]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    categoriesStore.loadCategories();
  }, [categoriesStore, isModalOpen]);

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
