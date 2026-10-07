import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { MatIcon, normalizeMaterialIconValue } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import styles from "./extra-data-category-label.module.css";

type ExtraDataCategoryLabelProps = {
  category: Pick<ExtraDataCategoryModel, "name" | "title" | "icon">;
};

export function ExtraDataCategoryLabel({ category }: ExtraDataCategoryLabelProps) {
  const { i18n } = useTranslation();
  const iconName = normalizeMaterialIconValue(category.icon);

  return (
    <span className={styles.root}>
      {iconName ? <MatIcon icon={iconName} size="small" /> : null}
      <span>{getExtraDataCategoryDisplayName(category, i18n.language)}</span>
    </span>
  );
}
