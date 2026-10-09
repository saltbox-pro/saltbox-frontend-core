import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  BaseActionButton,
  FastTable,
  FilterActionButton,
  type CellAction,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import {
  buildExtraDataFilterField,
  getEqualExtraDataColumnWidth,
  toExtraDataCopyValue,
} from "saltbox-core/shared/helpers/extra-data-value";
import type { ExtraDataRecord, ExtraDataRecordsStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

const columnHelper = createColumnHelper<ExtraDataRecord>();

const ExtraDataRecordsTable = FastTable.Paginated<ExtraDataRecord>;

export interface MinionExtraDataRecordTableProps {
  store: ExtraDataRecordsStore;
  fields: string[];
  category: ExtraDataCategoryModel;
  onFilterButton?: OnFilterButtonHandler;
  canChangeRecord?: (record: ExtraDataRecord) => boolean;
  onEditRecord?: (record: ExtraDataRecord) => void;
  onDeleteRecord?: (record: ExtraDataRecord) => void;
}

export const MinionExtraDataRecordTable = observer<MinionExtraDataRecordTableProps>(
  function MinionExtraDataRecordTable({
    store,
    fields,
    category,
    onFilterButton,
    canChangeRecord,
    onEditRecord,
    onDeleteRecord,
  }) {
    const { t, i18n } = useTranslation();

    const hasChangeableRecords = !!canChangeRecord && store.records.some(canChangeRecord);

    const columns = useMemo(() => {
      const columnWidth = getEqualExtraDataColumnWidth(fields.length);

      const fieldColumns = fields.map((field) => {
        const filterFieldName = buildExtraDataFilterField(category.source, category.name, field);
        const filterAction: CellAction<ExtraDataRecord> | null = onFilterButton
          ? {
              icon: FilterActionButton.getIcon(),
              visible: (value) => onFilterButton.canApply(filterFieldName, value),
              getPresentation: (value) =>
                FilterActionButton.getPresentation(onFilterButton.isActive(filterFieldName, value)),
              onClick: (value) =>
                onFilterButton({
                  name: filterFieldName,
                  value,
                }),
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

      if (!hasChangeableRecords || !canChangeRecord || !onEditRecord || !onDeleteRecord) {
        return fieldColumns;
      }

      return [
        ...fieldColumns,
        columnHelper.display({
          id: "actions",
          header: "",
          enableSorting: false,
          cell: ({ row }) =>
            canChangeRecord(row.original) ? (
              <Flex align="center" gap={4}>
                <BaseActionButton
                  icon={<EditOutlined />}
                  title={t("common.edit")}
                  onClick={() => onEditRecord(row.original)}
                />
                <BaseActionButton
                  color="danger"
                  icon={<DeleteOutlined />}
                  title={t("common.delete")}
                  onClick={() => onDeleteRecord(row.original)}
                />
              </Flex>
            ) : null,
          meta: { ellipsis: false, width: 76, minWidth: 76 },
        }),
      ];
    }, [
      fields,
      onFilterButton,
      category,
      t,
      hasChangeableRecords,
      canChangeRecord,
      onEditRecord,
      onDeleteRecord,
    ]);

    return (
      <ExtraDataRecordsTable
        tableId="core-minion-extra-data-records"
        columns={columns}
        data={store.records}
        total={store.totalRecords}
        isLoading={store.isLoading}
        onRefresh={() => store.loadRecords()}
        loader={store.recordsLoad}
        pagination={store.pagination}
        sorting={store.sorting}
        onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
        locale={{
          empty: t("minions.extra-data.empty-category", {
            category: getExtraDataCategoryDisplayName(category, i18n.language),
          }),
        }}
      />
    );
  }
);
