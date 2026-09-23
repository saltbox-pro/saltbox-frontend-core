import { FilterOutlined } from "@ant-design/icons";
import type {
  CollectionExtraDataListItemSchema,
  ExtraDataCategoryModel,
} from "@saltbox/saltbox-core-api-client";
import { FastTable, RefreshButton, type CellAction } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataSearchField } from "saltbox-core/shared/components/extra-data-search-field";
import {
  buildExtraDataFilterField,
  collectCollectionExtraDataFieldNamesFromRecords,
  getDeclaredCollectionExtraDataFieldNames,
  getEqualExtraDataColumnWidth,
  toExtraDataCopyValue,
} from "saltbox-core/shared/helpers/extra-data-value";
import { CollectionExtraDataRecordsStore, type MinionFilterStore } from "saltbox-core/store";

import {
  canBuildClientFilter,
  fieldSupportsNullOperator,
  hasClientFilter,
  toggleClientFilter,
} from "../model/toggle-client-filter";

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
  const { t } = useTranslation();

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

  const nullOperatorFields = useMemo(() => {
    const supported = new Set<string>();

    for (const field of fields) {
      if (field === "minions_count") {
        continue;
      }

      const fieldName = buildExtraDataFilterField(category.source, category.name, field);
      if (fieldSupportsNullOperator(filterStore.filterSchema, fieldName)) {
        supported.add(field);
      }
    }

    return supported;
  }, [category, fields, filterStore.filterSchema]);

  const columns = useMemo(() => {
    const columnWidth = getEqualExtraDataColumnWidth(fields.length);

    return fields.map((field) => {
      const canFilterField = field !== "minions_count";
      const supportsNull = nullOperatorFields.has(field);

      const createCellFilter = (value: unknown) => ({
        categorySource: category.source,
        categoryName: category.name,
        field,
        value,
        supportsNull,
      });

      const filterAction: CellAction<CollectionExtraDataListItemSchema> | null = canFilterField
        ? {
            icon: <FilterOutlined />,
            visible: (value) => canBuildClientFilter(createCellFilter(value)),
            getPresentation: (value) => ({
              title: hasClientFilter(filterStore.currentFilters, createCellFilter(value))
                ? t("minions.extra-data.remove-from-client-filters")
                : t("minions.extra-data.add-to-client-filters"),
            }),
            onClick: (value) => {
              const next = toggleClientFilter(filterStore.currentFilters, createCellFilter(value));
              if (!next) {
                return;
              }

              filterStore.handleFiltersChange(next.filters);
              if (next.result === "added") {
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
  }, [fields, filterStore, nullOperatorFields, onFilterAdded, category, t]);

  const emptyMessage =
    store.recordsLoad.status === "success"
      ? t("minions.extra-data.empty-category", {
          category: t(`minions.extra-data.categories.${category.name}`, {
            defaultValue: category.name,
          }),
        })
      : "";

  return (
    <FastTable.Provider>
      <Flex vertical className={styles.root}>
        <div className="page-actions-buttons">
          <div className="page-actions-buttons-right">
            <ExtraDataSearchField key={category.name} onSearch={store.setSearch} />
            <RefreshButton
              loading={store.isLoading}
              disabled={store.isLoading}
              onClick={() => store.loadRecords()}
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
