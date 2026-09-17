import { ErrorZone } from "@saltbox/saltbox-frontend-common";
import { Flex, Spin, Tabs } from "antd";
import { observer } from "mobx-react-lite";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataCategoryLabel } from "saltbox-core/shared/components/extra-data-category-label";
import { ExtraDataCategoriesStore, type MinionFilterStore } from "saltbox-core/store";

import { useExtraDataCategoryUrl } from "../hooks/use-extra-data-category-url";

import { CollectionExtraDataCategoryTable } from "./collection-extra-data-category-table";
import styles from "./collection-extra-data-tab.module.css";

export type CollectionExtraDataTabProps = {
  collectionSlug: string;
  filterStore: MinionFilterStore;
  filterControls?: ReactNode;
  onFilterAdded?: () => void;
};

export const CollectionExtraDataTab = observer(function CollectionExtraDataTab({
  collectionSlug,
  filterStore,
  filterControls,
  onFilterAdded,
}: CollectionExtraDataTabProps) {
  const { t } = useTranslation();
  const [categoriesStore] = useState(
    () =>
      new ExtraDataCategoriesStore({
        pageSize: 200,
      })
  );

  useEffect(() => {
    categoriesStore.loadCategories();

    return () => {
      categoriesStore.reset();
    };
  }, [categoriesStore]);

  const { orderedCategories, activeCategory, activeCategoryModel, setActiveCategory } =
    useExtraDataCategoryUrl({
      categories: categoriesStore.categories,
      isLoading: categoriesStore.isLoading,
    });

  return (
    <Flex vertical className={styles.root}>
      {filterControls}
      <ErrorZone level="block" loaders={[categoriesStore.categoriesLoad]}>
        {categoriesStore.isLoading && orderedCategories.length === 0 ? (
          <Flex align="center" justify="center" className={styles.loader}>
            <Spin />
          </Flex>
        ) : orderedCategories.length === 0 ? (
          <Flex align="center" justify="center" className={styles.loader}>
            {t("minions.extra-data.empty")}
          </Flex>
        ) : (
          <Flex vertical flex={1} className={styles.content}>
            <Tabs
              activeKey={activeCategory ?? undefined}
              onChange={setActiveCategory}
              items={orderedCategories.map((category) => ({
                key: category.name,
                label: <ExtraDataCategoryLabel name={category.name} />,
              }))}
            />

            {!!activeCategoryModel && (
              <CollectionExtraDataCategoryTable
                key={`${collectionSlug}-${activeCategoryModel.id}`}
                category={activeCategoryModel}
                collectionSlug={collectionSlug}
                filterStore={filterStore}
                onFilterAdded={onFilterAdded}
              />
            )}
          </Flex>
        )}
      </ErrorZone>
    </Flex>
  );
});
