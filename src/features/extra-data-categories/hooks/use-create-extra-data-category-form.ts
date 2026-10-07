import { type ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  type AppError,
  getLocalizedText,
  runMutation,
  toLocalizedTextPayload,
} from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { createExtraDataCategory } from "../api/create-extra-data-category";
import { DEFAULT_EXTRA_DATA_CATEGORY_TYPE } from "../constants/category-types";
import { DEFAULT_EXTRA_FIELDS_POLICY } from "../constants/extra-fields-policies";
import {
  EXTRA_DATA_CATEGORY_DESCRIPTION_NAME,
  EXTRA_DATA_CATEGORY_FIELDS_NAME,
  EXTRA_DATA_CATEGORY_ICON_NAME,
  EXTRA_DATA_CATEGORY_IS_SINGLE_ITEM_NAME,
  EXTRA_DATA_CATEGORY_TITLE_NAME,
} from "../constants/form-field-names";
import {
  type ExtraDataCategoryFieldFormValue,
  toExtraDataCategoryFieldsPayload,
} from "../helpers/extra-data-category-field-form";
import { toExtraDataCategoryIconPayload } from "../helpers/extra-data-category-meta-form";
import { isDuplicateCategoryNameError } from "../helpers/is-duplicate-category-name-error";

export type CreateExtraDataCategoryFormValues = {
  name: string;
  [EXTRA_DATA_CATEGORY_TITLE_NAME]?: Record<string, string>;
  [EXTRA_DATA_CATEGORY_DESCRIPTION_NAME]?: Record<string, string>;
  [EXTRA_DATA_CATEGORY_ICON_NAME]?: string;
  [EXTRA_DATA_CATEGORY_IS_SINGLE_ITEM_NAME]?: boolean;
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
  const { t, i18n } = useTranslation();

  const [isCreating, setIsCreating] = useState(false);
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const resetMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: CreateExtraDataCategoryFormValues) => {
      setIsCreating(true);
      setMutationError(null);

      try {
        const name = values.name.trim();
        const title = toLocalizedTextPayload(values[EXTRA_DATA_CATEGORY_TITLE_NAME]);
        const description = toLocalizedTextPayload(values[EXTRA_DATA_CATEGORY_DESCRIPTION_NAME]);
        const icon = toExtraDataCategoryIconPayload(values[EXTRA_DATA_CATEGORY_ICON_NAME]);
        const isSingleItem = !!values[EXTRA_DATA_CATEGORY_IS_SINGLE_ITEM_NAME];
        const displayName = getLocalizedText(title, i18n.language) || name;

        const result = await runMutation({
          run: () =>
            createExtraDataCategory({
              name,
              type: DEFAULT_EXTRA_DATA_CATEGORY_TYPE,
              extra_fields_policy: DEFAULT_EXTRA_FIELDS_POLICY,
              is_single_item: isSingleItem,
              ...(title ? { title } : {}),
              ...(description ? { description } : {}),
              ...(icon ? { icon } : {}),
              fields: toExtraDataCategoryFieldsPayload(values[EXTRA_DATA_CATEGORY_FIELDS_NAME]),
            }),
          successMessage: t("extra-data-categories.create.success", { name: displayName }),
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

        if (!result.ok) return;

        onSuccess?.(result.data);
        onClose();
      } finally {
        setIsCreating(false);
      }
    },
    [form, i18n.language, onClose, onSuccess, t]
  );

  return {
    handleSubmit,
    isCreating,
    mutationError,
    resetMutationError,
  };
}
