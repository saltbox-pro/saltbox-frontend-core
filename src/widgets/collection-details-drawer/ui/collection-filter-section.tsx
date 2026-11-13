import { ErrorZone } from "@saltbox/saltbox-frontend-common";
import { Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MinionsQueryBuilder } from "saltbox-core/shared/components/minions-query-builder";
import { ExtraDataCategoriesContext } from "saltbox-core/shared/contexts/extra-data-categories-context";
import { ExtraDataCategoriesStore, type MinionFilterStore } from "saltbox-core/store";

import styles from "./collection-details-drawer.module.css";

const EXTRA_DATA_CATEGORIES_PAGE_SIZE = 200;

interface CollectionFilterSectionProps {
  filterStore: MinionFilterStore;
  parentSlug: string;
  onFiltersApplied: () => void;
}

export const CollectionFilterSection = observer(
  ({ filterStore, parentSlug, onFiltersApplied }: CollectionFilterSectionProps) => {
    const { t } = useTranslation();
    const [categoriesStore] = useState(
      () => new ExtraDataCategoriesStore({ pageSize: EXTRA_DATA_CATEGORIES_PAGE_SIZE })
    );

    useEffect(() => {
      categoriesStore.loadCategories();
      return () => {
        categoriesStore.reset();
        categoriesStore.categoriesLoad.resetInitial();
      };
    }, [categoriesStore]);

    return (
      <div className={styles.filterSection}>
        <Typography.Text strong className={styles.filterHeading}>
          {t("minions.collection-query")}
        </Typography.Text>

        <ErrorZone level="block" keepContentOnError loaders={[categoriesStore.categoriesLoad]}>
          <ExtraDataCategoriesContext.Provider value={categoriesStore}>
            <MinionsQueryBuilder
              slug={parentSlug}
              filterStore={filterStore}
              onSearch={onFiltersApplied}
              onReset={onFiltersApplied}
            />
          </ExtraDataCategoriesContext.Provider>
        </ErrorZone>
      </div>
    );
  }
);
