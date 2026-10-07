import type { ExtraDataCategoryType } from "@saltbox/saltbox-core-api-client";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryTypeColor } from "../helpers/category-type-presentation";

type ExtraDataCategoryTypeTagProps = {
  type: ExtraDataCategoryType;
};

export function ExtraDataCategoryTypeTag({ type }: ExtraDataCategoryTypeTagProps) {
  const { t } = useTranslation();

  return (
    <Tag color={getExtraDataCategoryTypeColor(type)}>
      {t(`extra-data-categories.category-types.${type}`, { defaultValue: type })}
    </Tag>
  );
}
