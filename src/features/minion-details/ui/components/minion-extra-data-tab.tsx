import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { FastTable, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AddExtraDataButton,
  ExtraDataItemModal,
} from "saltbox-core/features/minion-extra-data-editor";
import { ExtraDataCategoryLabel } from "saltbox-core/shared/components/extra-data-category-label";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { ExtraDataCategoriesStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import { MinionExtraDataCategoryDrawer } from "./minion-extra-data-category-drawer";
import styles from "./minion-extra-data-tab.module.css";

const columnHelper = createColumnHelper<ExtraDataCategoryModel>();

const ExtraDataCategoriesTable = FastTable.Paginated<ExtraDataCategoryModel>;

interface MinionExtraDataTabProps {
  minionId: string;
  collectionSlug: string;
  isInDrawer?: boolean;
  onFilterButton?: OnFilterButtonHandler;
}

export const MinionExtraDataTab = observer(function MinionExtraDataTab({
  minionId,
  collectionSlug,
  isInDrawer = false,
  onFilterButton,
}: MinionExtraDataTabProps) {
  const { t } = useTranslation();

  const [store] = useState(() => new ExtraDataCategoriesStore());
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);

  const categoryDrawer = useInfoDrawer<ExtraDataCategoryModel, string, HTMLTableSectionElement>({
    getId: (category) => category.id,
    drawerId: DRAWER_IDS.extraDataCategoryDetails,
  });

  useEffect(() => {
    store.loadCategories();

    return () => {
      store.reset();
    };
  }, [store]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("minions.extra-data.category-column"),
        cell: (info) => <ExtraDataCategoryLabel name={info.getValue()} />,
      }),
    ],
    [t]
  );

  return (
    <Flex vertical flex={1} className={styles.extraDataTabContent}>
      <FastTable.Provider>
        <div className="page-actions-buttons">
          <AddExtraDataButton onClick={() => setIsCreateItemOpen(true)} />
          <FastTable.Toolbar />
        </div>

        <ExtraDataCategoriesTable
          tableId={
            isInDrawer
              ? "core-minion-extra-data-categories-drawer"
              : "core-minion-extra-data-categories"
          }
          columns={columns}
          enableColumnSettings={false}
          data={store.categories}
          total={store.total}
          isLoading={store.isLoading}
          loader={store.categoriesLoad}
          pagination={store.pagination}
          sorting={store.sorting}
          onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
          onRefresh={store.loadCategories}
          getRowId={(row) => row.id}
          activeRowId={categoryDrawer.activeRowId}
          bodyRef={categoryDrawer.mainContentRef}
          onRowClick={categoryDrawer.toggle}
          locale={{ empty: t("minions.extra-data.empty") }}
        />

        <MinionExtraDataCategoryDrawer
          open={categoryDrawer.isOpened}
          category={categoryDrawer.openedArg}
          minionId={minionId}
          collectionSlug={collectionSlug}
          width={960}
          onClose={categoryDrawer.close}
          onFilterButton={onFilterButton}
        />

        <ExtraDataItemModal
          open={isCreateItemOpen}
          minionId={minionId}
          onCancel={() => setIsCreateItemOpen(false)}
          onCategoryCreated={store.loadCategories}
        />
      </FastTable.Provider>
    </Flex>
  );
});
