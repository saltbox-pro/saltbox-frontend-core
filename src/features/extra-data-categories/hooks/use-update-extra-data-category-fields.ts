import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { updateExtraDataCategory } from "../api/update-extra-data-category";
import {
  type ExtraDataCategoryFieldFormValue,
  getRetainedMinionFields,
  toExtraDataCategoryFieldsPayload,
} from "../helpers/extra-data-category-field-form";

type UseUpdateExtraDataCategoryFieldsParams = {
  category: ExtraDataCategoryModel;
  onSuccess?: (category: ExtraDataCategoryModel) => void;
};

export function useUpdateExtraDataCategoryFields({
  category,
  onSuccess,
}: UseUpdateExtraDataCategoryFieldsParams) {
  const { t } = useTranslation();

  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const resetMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const saveFields = useCallback(
    async (values: readonly ExtraDataCategoryFieldFormValue[] | undefined) => {
      setIsSaving(true);
      setMutationError(null);

      const fields = toExtraDataCategoryFieldsPayload(values);

      const result = await runMutation({
        run: () =>
          updateExtraDataCategory({
            source: category.source,
            name: category.name,
            data: {
              fields,
              minion_fields: getRetainedMinionFields(
                category.minion_fields,
                category.fields,
                fields
              ),
            },
          }),
        successMessage: t("extra-data-categories.fields-editor.success"),
        onError: setMutationError,
      });

      setIsSaving(false);
      if (!result.ok) return;

      onSuccess?.(result.data);
    },
    [category.fields, category.minion_fields, category.name, category.source, onSuccess, t]
  );

  return {
    saveFields,
    isSaving,
    mutationError,
    resetMutationError,
  };
}
