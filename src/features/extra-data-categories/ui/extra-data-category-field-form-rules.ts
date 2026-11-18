import type { Rule } from "antd/es/form";
import type { TFunction } from "i18next";

import { getExtraDataCategoryFieldNameIssue } from "../helpers/extra-data-category-field-form";

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
        switch (getExtraDataCategoryFieldNameIssue(value, isDuplicate)) {
          case "forbidden":
            throw new Error(t("extra-data-categories.name-forbidden-characters"));
          case "duplicate":
            throw new Error(t("extra-data-categories.field-form.field-name-unique"));
          default:
            return;
        }
      },
    },
  ];
}

export function getExtraDataCategoryFieldTypeRules(t: TFunction): Rule[] {
  return [
    {
      required: true,
      message: t("extra-data-categories.field-form.field-type-required"),
    },
  ];
}
