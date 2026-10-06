import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EXTRA_DATA_FIELD_TYPE_OPTIONS } from "../constants/field-types";

export function useExtraDataCategoryFieldTypeOptions() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      EXTRA_DATA_FIELD_TYPE_OPTIONS.map((type) => ({
        value: type,
        label: t(`extra-data-categories.field-types.${type}`),
      })),
    [t]
  );
}
