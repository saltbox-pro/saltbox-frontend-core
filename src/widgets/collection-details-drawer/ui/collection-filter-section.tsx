import { Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { MinionsQueryBuilder } from "saltbox-core/shared/components/minions-query-builder";
import type { MinionFilterStore } from "saltbox-core/store";

import styles from "./collection-details-drawer.module.css";

interface CollectionFilterSectionProps {
  filterStore: MinionFilterStore;
  parentSlug: string;
  onFiltersApplied: () => void;
}

export const CollectionFilterSection = observer(
  ({ filterStore, parentSlug, onFiltersApplied }: CollectionFilterSectionProps) => {
    const { t } = useTranslation();

    return (
      <div className={styles.filterSection}>
        <Typography.Text strong className={styles.filterHeading}>
          {t("minions.collection-query")}
        </Typography.Text>

        <MinionsQueryBuilder
          slug={parentSlug}
          filterStore={filterStore}
          onSearch={onFiltersApplied}
          onReset={onFiltersApplied}
          enableFreeTextMode
        />
      </div>
    );
  }
);
