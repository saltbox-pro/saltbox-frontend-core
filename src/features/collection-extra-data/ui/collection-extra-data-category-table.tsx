import type {
  CollectionExtraDataListItemSchema,
  ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";
import {
  applyFilterByValue,
  canApplyFilterByValue,
  FastTable,
  FilterActionButton,
  getFilterFieldOptions,
  hasFilterByValue,
  type CellAction,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataExportButton } from "saltbox-core/features/extra-data-export";
import { ExtraDataSearchField } from "saltbox-core/shared/components/extra-data-search-field";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import {
  buildExtraDataFilterField,
  collectCollectionExtraDataFieldNamesFromRecords,
  getDeclaredCollectionExtraDataFieldNames,
  getEqualExtraDataColumnWidth,
  toExtraDataCopyValue,
} from "saltbox-core/shared/helpers/extra-data-value";
import { CollectionExtraDataRecordsStore, type MinionFilterStore } from "saltbox-core/store";

import styles from "./collection-extra-data-category-table.module.css";

const columnHelper = createColumnHelper<CollectionExtraDataListItemSchema>();
const ExtraDataRecordsTable = FastTable.Paginated<CollectionExtraDataListItemSchema>;

export type CollectionExtraDataCategoryTableProps = {
  category: ExtraDataCategoryModel;
  collectionSlug: string;
  filterStore: MinionFilterStore;
  onFilterAdded?: () => void;
};

export const CollectionExtraDataCategoryTable = observer(function CollectionExtraDataCategoryTable({
  category,
  collectionSlug,
  filterStore,
  onFilterAdded,
}: CollectionExtraDataCategoryTableProps) {
  const { t, i18n } = useTranslation();

  const [store] = useState(
    () =>
      new CollectionExtraDataRecordsStore({
        collectionSlug,
        categoryId: category.id,
      })
  );

  useEffect(() => {
    store.loadRecords();

    return () => {
      store.reset();
    };
  }, [store]);

  const declaredFields = useMemo(
    () => getDeclaredCollectionExtraDataFieldNames(category),
    [category]
  );

  const fields = useMemo(() => {
    if (declaredFields.length > 0) {
      return declaredFields;
    }

    return collectCollectionExtraDataFieldNamesFromRecords(store.records);
  }, [declaredFields, store.records]);

  const { filterSchema, filtersRevision } = filterStore;

  const columns = useMemo(() => {
    const columnWidth = getEqualExtraDataColumnWidth(fields.length);

    return fields.map((field) => {
      const canFilterField = field !== "minions_count";
      const filterFieldName = buildExtraDataFilterField(category.source, category.name, field);
      const fieldOptions = getFilterFieldOptions(filterSchema, filterFieldName);

      const filterAction: CellAction<CollectionExtraDataListItemSchema> | null = canFilterField
        ? {
            icon: FilterActionButton.getIcon(),
            visible: (value) =>
              canApplyFilterByValue(filterStore, filterFieldName, value, fieldOptions),
            getPresentation: (value) =>
              FilterActionButton.getPresentation(
                hasFilterByValue(filterStore, filterFieldName, value, fieldOptions)
              ),
            onClick: (value) => {
              const next = applyFilterByValue(filterStore, filterFieldName, value, {
                fieldOptions,
              });
              if (next.ok && next.result === "added") {
                onFilterAdded?.();
              }
            },
          }
        : null;

      return columnHelper.accessor((row) => row[field], {
        id: field,
        header: field,
        cell: ({ getValue }) => toExtraDataCopyValue(getValue()),
        meta: {
          width: columnWidth,
          minWidth: 180,
          showCopy: true,
          copyValue: (row) => toExtraDataCopyValue(row[field]),
          actions: filterAction ? [filterAction] : undefined,
        },
      });
    });
  }, [fields, filterStore, filterSchema, filtersRevision, onFilterAdded, category]);

  const emptyMessage =
    store.recordsLoad.status === "success"
      ? t("minions.extra-data.empty-category", {
          category: getExtraDataCategoryDisplayName(category, i18n.language),
        })
      : "";

  return (
    <FastTable.Provider>
      <Flex vertical className={styles.root}>
        <div className="page-actions-buttons">
          <div className={styles.toolbarActions}>
            <ExtraDataSearchField
              key={category.name}
              value={store.search}
              onSearch={store.setSearch}
            />
            <ExtraDataExportButton
              category={category}
              collectionSlug={collectionSlug}
              search={store.search}
            />
            <FastTable.Toolbar />
          </div>
        </div>

        <ExtraDataRecordsTable
          tableId={`core-collection-extra-data-${category.name}`}
          columns={columns}
          data={store.recordsSnapshot}
          total={store.totalRecords}
          isLoading={store.isLoading}
          onRefresh={() => store.loadRecords()}
          loader={store.recordsLoad}
          pagination={store.pagination}
          sorting={store.sorting}
          onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
          locale={{ empty: emptyMessage }}
        />
      </Flex>
    </FastTable.Provider>
  );
});
