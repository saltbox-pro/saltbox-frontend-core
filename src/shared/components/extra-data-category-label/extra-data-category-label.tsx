import { MatIcon } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

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
      <span>{getExtraDataCategoryDisplayName(t, name)}</span>
    </span>
  );
}
