import { MatIcon } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryIcon } from "./extra-data-category-icon";
import styles from "./extra-data-category-label.module.css";

type ExtraDataCategoryLabelProps = {
  name: string;
};

export function ExtraDataCategoryLabel({ name }: ExtraDataCategoryLabelProps) {
  const { t } = useTranslation();
  const icon = getExtraDataCategoryIcon(name);

  return (
    <span className={styles.root}>
      {icon && <MatIcon icon={icon} size="small" />}
      <span>{t(`minions.extra-data.categories.${name}`, { defaultValue: name })}</span>
    </span>
  );
}
