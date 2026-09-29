import { DeleteOutlined, FilterOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { BaseActionButton, FastTable, type CellAction } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import {
  buildExtraDataFilterField,
  canFilterExtraDataValue,
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
  canDeleteRecord?: (record: ExtraDataRecord) => boolean;
  onDeleteRecord?: (record: ExtraDataRecord) => void;
}

export const MinionExtraDataRecordTable = observer<MinionExtraDataRecordTableProps>(
  function MinionExtraDataRecordTable({
    store,
    fields,
    category,
    onFilterButton,
    canDeleteRecord,
    onDeleteRecord,
  }) {
    const { t } = useTranslation();

    const hasDeletableRecords = !!canDeleteRecord && store.records.some(canDeleteRecord);

    const columns = useMemo(() => {
      const columnWidth = getEqualExtraDataColumnWidth(fields.length);

      const fieldColumns = fields.map((field) => {
        const filterAction: CellAction<ExtraDataRecord> | null = onFilterButton
          ? {
              icon: <FilterOutlined />,
              title: t("minions.extra-data.apply-to-filters"),
              visible: (value) => canFilterExtraDataValue(value),
              onClick: (value) =>
                onFilterButton({
                  name: buildExtraDataFilterField(category.source, category.name, field),
                  value,
                  keepDrawerOpen: true,
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

      if (!hasDeletableRecords || !canDeleteRecord || !onDeleteRecord) {
        return fieldColumns;
      }

      return [
        ...fieldColumns,
        columnHelper.display({
          id: "delete",
          header: "",
          enableSorting: false,
          cell: ({ row }) =>
            canDeleteRecord(row.original) ? (
              <BaseActionButton
                color="danger"
                icon={<DeleteOutlined />}
                title={t("common.delete")}
                onClick={() => onDeleteRecord(row.original)}
              />
            ) : null,
          meta: { ellipsis: false, width: 40, minWidth: 40 },
        }),
      ];
    }, [fields, onFilterButton, category, t, hasDeletableRecords, canDeleteRecord, onDeleteRecord]);

    return (
      <ExtraDataRecordsTable
        tableId="core-minion-extra-data-records"
        columns={columns}
        data={toJS(store.records)}
        total={store.totalRecords}
        isLoading={store.isLoading}
        onRefresh={() => store.loadRecords()}
        loader={store.recordsLoad}
        pagination={store.pagination}
        sorting={store.sorting}
        onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
        locale={{
          empty: t("minions.extra-data.empty-category", {
            category: getExtraDataCategoryDisplayName(t, category.name),
          }),
        }}
      />
    );
  }
);
