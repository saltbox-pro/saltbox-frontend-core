import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";

import { orderExtraDataCategories } from "../helpers/categories";
import {
  EXTRA_DATA_CATEGORY_QUERY_PARAM,
  resolveActiveExtraDataCategoryName,
} from "../model/extra-data-category-url";

export function useExtraDataCategoryUrl(args: {
  categories: readonly ExtraDataCategoryModel[];
  isLoading: boolean;
}) {
  const { categories, isLoading } = args;
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get(EXTRA_DATA_CATEGORY_QUERY_PARAM);

  const orderedCategories = useMemo(() => orderExtraDataCategories(categories), [categories]);

  const activeCategory = useMemo(
    () => resolveActiveExtraDataCategoryName(orderedCategories, categoryFromUrl),
    [orderedCategories, categoryFromUrl]
  );

  useEffect(() => {
    if (isLoading || orderedCategories.length === 0) {
      return;
    }

    if (categoryFromUrl === activeCategory) {
      return;
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (activeCategory) {
          next.set(EXTRA_DATA_CATEGORY_QUERY_PARAM, activeCategory);
        } else {
          next.delete(EXTRA_DATA_CATEGORY_QUERY_PARAM);
        }
        return next;
      },
      { replace: true }
    );
  }, [activeCategory, categoryFromUrl, isLoading, orderedCategories.length, setSearchParams]);

  const setActiveCategory = useCallback(
    (categoryName: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(EXTRA_DATA_CATEGORY_QUERY_PARAM, categoryName);
        return next;
      });
    },
    [setSearchParams]
  );

  return {
    orderedCategories,
    activeCategory,
    activeCategoryModel: orderedCategories.find((category) => category.name === activeCategory),
    setActiveCategory,
  };
}
