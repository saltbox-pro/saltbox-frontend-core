import { Tag } from "antd";
import { useTranslation } from "react-i18next";

import {
  getExtraDataCategoryOrigin,
  getExtraDataCategoryOriginColor,
} from "../helpers/category-origin-presentation";

type ExtraDataCategoryOriginTagProps = {
  isSystem: boolean | undefined;
};

export function ExtraDataCategoryOriginTag({ isSystem }: ExtraDataCategoryOriginTagProps) {
  const { t } = useTranslation();
  const origin = getExtraDataCategoryOrigin(isSystem);

  return (
    <Tag color={getExtraDataCategoryOriginColor(origin)}>
      {t(`extra-data-categories.origins.${origin}`)}
    </Tag>
  );
}
