import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  type AppError,
  runMutation,
  toLocalizedTextPayload,
} from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { updateExtraDataCategory } from "../api/update-extra-data-category";
import {
  EXTRA_DATA_CATEGORY_DESCRIPTION_NAME,
  EXTRA_DATA_CATEGORY_ICON_NAME,
  EXTRA_DATA_CATEGORY_TITLE_NAME,
} from "../constants/form-field-names";
import {
  type ExtraDataCategoryMetaFormValues,
  toExtraDataCategoryIconPayload,
} from "../helpers/extra-data-category-meta-form";

type UseUpdateExtraDataCategoryMetaParams = {
  category: ExtraDataCategoryModel;
  onSuccess?: (category: ExtraDataCategoryModel) => void;
};

export function useUpdateExtraDataCategoryMeta({
  category,
  onSuccess,
}: UseUpdateExtraDataCategoryMetaParams) {
  const { t } = useTranslation();

  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const resetMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const saveCategory = useCallback(
    async (values: ExtraDataCategoryMetaFormValues) => {
      setIsSaving(true);
      setMutationError(null);

      try {
        const title = toLocalizedTextPayload(values[EXTRA_DATA_CATEGORY_TITLE_NAME]);
        const description = toLocalizedTextPayload(values[EXTRA_DATA_CATEGORY_DESCRIPTION_NAME]);
        const icon = toExtraDataCategoryIconPayload(values[EXTRA_DATA_CATEGORY_ICON_NAME]);

        const result = await runMutation({
          run: () =>
            updateExtraDataCategory({
              source: category.source,
              name: category.name,
              data: {
                title,
                description,
                icon,
              },
            }),
          successMessage: t("extra-data-categories.category-editor.success"),
          onError: setMutationError,
        });

        if (!result.ok) return;

        onSuccess?.(result.data);
      } finally {
        setIsSaving(false);
      }
    },
    [category.name, category.source, onSuccess, t]
  );

  return {
    saveCategory,
    isSaving,
    mutationError,
    resetMutationError,
  };
}
