import { type ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { type AppError, runMutation } from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { createExtraDataCategory } from "../api/create-extra-data-category";
import { DEFAULT_EXTRA_DATA_CATEGORY_TYPE } from "../constants/category-types";
import { DEFAULT_EXTRA_FIELDS_POLICY } from "../constants/extra-fields-policies";
import { EXTRA_DATA_CATEGORY_FIELDS_NAME } from "../constants/fields-name";
import {
  type ExtraDataCategoryFieldFormValue,
  toExtraDataCategoryFieldsPayload,
} from "../helpers/extra-data-category-field-form";
import { isDuplicateCategoryNameError } from "../helpers/is-duplicate-category-name-error";

export type CreateExtraDataCategoryFormValues = {
  name: string;
  [EXTRA_DATA_CATEGORY_FIELDS_NAME]?: ExtraDataCategoryFieldFormValue[];
};

type UseCreateExtraDataCategoryFormParams = {
  form: FormInstance<CreateExtraDataCategoryFormValues>;
  onSuccess?: (category: ExtraDataCategoryModel) => void;
  onClose: () => void;
};

export function useCreateExtraDataCategoryForm({
  form,
  onSuccess,
  onClose,
}: UseCreateExtraDataCategoryFormParams) {
  const { t } = useTranslation();

  const [isCreating, setIsCreating] = useState(false);
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const resetMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: CreateExtraDataCategoryFormValues) => {
      setIsCreating(true);
      setMutationError(null);

      const name = values.name.trim();

      const result = await runMutation({
        run: () =>
          createExtraDataCategory({
            name,
            type: DEFAULT_EXTRA_DATA_CATEGORY_TYPE,
            extra_fields_policy: DEFAULT_EXTRA_FIELDS_POLICY,
            fields: toExtraDataCategoryFieldsPayload(values[EXTRA_DATA_CATEGORY_FIELDS_NAME]),
          }),
        successMessage: t("extra-data-categories.create.success", { name }),
        onError: (error) => {
          if (isDuplicateCategoryNameError(error)) {
            form.setFields([
              { name: "name", errors: [t("extra-data-categories.create.field-name-unique")] },
            ]);
            return;
          }
          setMutationError(error);
        },
      });

      setIsCreating(false);
      if (!result.ok) return;

      onSuccess?.(result.data);
      onClose();
    },
    [form, onClose, onSuccess, t]
  );

  return {
    handleSubmit,
    isCreating,
    mutationError,
    resetMutationError,
  };
}
