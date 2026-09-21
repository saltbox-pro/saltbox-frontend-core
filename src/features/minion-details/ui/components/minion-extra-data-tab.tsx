import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { FastTable, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataCategoryLabel } from "saltbox-core/shared/components/extra-data-category-label";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { ExtraDataCategoriesStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import { MinionExtraDataCategoryDrawer } from "./minion-extra-data-category-drawer";

const columnHelper = createColumnHelper<ExtraDataCategoryModel>();

const ExtraDataCategoriesTable = FastTable.Paginated<ExtraDataCategoryModel>;

interface MinionExtraDataTabProps {
  minionId: string;
  isInDrawer?: boolean;
  onFilterButton?: OnFilterButtonHandler;
}

export const MinionExtraDataTab = observer(function MinionExtraDataTab({
  minionId,
  isInDrawer = false,
  onFilterButton,
}: MinionExtraDataTabProps) {
  const { t } = useTranslation();

  const [store] = useState(() => new ExtraDataCategoriesStore());

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
    <Flex vertical gap="small" flex={1}>
      <ExtraDataCategoriesTable
        tableId={
          isInDrawer
            ? "core-minion-extra-data-categories-drawer"
            : "core-minion-extra-data-categories"
        }
        columns={columns}
        enableColumnSettings={false}
        data={toJS(store.categories)}
        total={store.total}
        isLoading={store.isLoading}
        loader={store.categoriesLoad}
        pagination={store.pagination}
        sorting={store.sorting}
        onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
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
        width={960}
        onClose={categoryDrawer.close}
        onFilterButton={onFilterButton}
      />
    </Flex>
  );
});
