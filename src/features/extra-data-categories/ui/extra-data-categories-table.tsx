import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  createBooleanColumn,
  formatTimeByUserTZ,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataCategoryLabel } from "saltbox-core/shared/components/extra-data-category-label";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import type { DrawerCloseGuard } from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";
import type { ExtraDataCategoriesStore } from "saltbox-core/store";

import { ExtraDataCategoryDrawer } from "./extra-data-category-drawer";
import { ExtraDataCategoryOriginTag } from "./extra-data-category-origin-tag";
import { ExtraDataCategoryTypeTag } from "./extra-data-category-type-tag";

const columnHelper = createColumnHelper<ExtraDataCategoryModel>();
const CategoriesTable = FastTable.Paginated<ExtraDataCategoryModel>;

type ExtraDataCategoriesTableProps = {
  store: ExtraDataCategoriesStore;
};

export const ExtraDataCategoriesTable = observer(function ExtraDataCategoriesTable({
  store,
}: ExtraDataCategoriesTableProps) {
  const { t } = useTranslation();

  const closeGuardRef = useRef<DrawerCloseGuard | null>(null);

  const categoryDrawer = useInfoDrawer<ExtraDataCategoryModel, string, HTMLTableSectionElement>({
    getId: (category) => category.id,
    drawerId: DRAWER_IDS.extraDataCategorySettings,
    onBeforeClose: () => closeGuardRef.current?.() ?? true,
  });

  const openedCategory = useMemo(
    () =>
      categoryDrawer.openedId != null
        ? (store.categories.find(({ id }) => id === categoryDrawer.openedId) ?? null)
        : null,
    [categoryDrawer.openedId, store.categories]
  );

  const handleCategoryDeleted = async () => {
    closeGuardRef.current = null;
    await categoryDrawer.close();
    store.reloadAfterCategoryDeleted();
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("extra-data-categories.attributes.name"),
        cell: (info) => <ExtraDataCategoryLabel name={info.getValue()} />,
        meta: { minWidth: 300, width: "26%" },
      }),
      columnHelper.accessor("type", {
        header: t("extra-data-categories.attributes.type"),
        cell: (info) => <ExtraDataCategoryTypeTag type={info.getValue()} />,
        meta: { minWidth: 140, width: "11%", ellipsis: false },
      }),
      columnHelper.accessor("is_system", {
        header: t("extra-data-categories.attributes.origin"),
        cell: (info) => <ExtraDataCategoryOriginTag isSystem={info.getValue()} />,
        meta: { minWidth: 160, width: "14%", ellipsis: false },
      }),
      createBooleanColumn({
        accessorKey: "is_manual_data_allowed",
        header: t("extra-data-categories.attributes.manual-data-allowed"),
        meta: { minWidth: 140, width: "12%" },
      }),
      columnHelper.accessor((row) => row.fields?.length ?? 0, {
        id: "fields_count",
        header: t("extra-data-categories.attributes.fields-count"),
        enableSorting: false,
        meta: { minWidth: 100, width: "9%" },
      }),
      columnHelper.accessor("created", {
        header: t("extra-data-categories.attributes.created"),
        cell: (info) => formatTimeByUserTZ(info.getValue()),
        meta: { minWidth: 170, width: "14%" },
      }),
      columnHelper.accessor("modified", {
        header: t("extra-data-categories.attributes.modified"),
        cell: (info) => formatTimeByUserTZ(info.getValue()),
        meta: { minWidth: 170, width: "14%" },
      }),
    ],
    [t]
  );

  return (
    <>
      <CategoriesTable
        tableId="core-extra-data-categories"
        columns={columns}
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
        locale={{ empty: t("extra-data-categories.table.empty") }}
      />

      <ExtraDataCategoryDrawer
        open={categoryDrawer.isOpened}
        category={openedCategory}
        closeGuardRef={closeGuardRef}
        onClose={categoryDrawer.close}
        onCategoryUpdated={store.replaceCategory}
        onCategoryDeleted={handleCategoryDeleted}
      />
    </>
  );
});
