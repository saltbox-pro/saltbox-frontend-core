import type { Rule } from "antd/es/form";
import type { TFunction } from "i18next";

import { isValidExtraDataCategoryFieldName } from "../helpers/extra-data-category-name-validation";

export function getExtraDataCategoryFieldNameRules(
  t: TFunction,
  isDuplicate: (trimmedName: string) => boolean
): Rule[] {
  return [
    {
      required: true,
      whitespace: true,
      message: t("extra-data-categories.field-form.field-name-required"),
    },
    {
      validator: async (_, value: string | undefined) => {
        const trimmed = value?.trim();
        if (!trimmed) return;
        if (!isValidExtraDataCategoryFieldName(trimmed)) {
          throw new Error(t("extra-data-categories.name-forbidden-characters"));
        }
        if (isDuplicate(trimmed)) {
          throw new Error(t("extra-data-categories.field-form.field-name-unique"));
        }
      },
    },
  ];
}

export function getExtraDataCategoryFieldTypesRules(t: TFunction): Rule[] {
  return [
    {
      required: true,
      type: "array",
      min: 1,
      message: t("extra-data-categories.field-form.field-type-required"),
    },
  ];
}
