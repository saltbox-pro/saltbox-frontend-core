import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ExtraDataRecord, ExtraDataRecordsStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import { ExtraDataCell, isPrimitive } from "./extra-data-cell";

const columnHelper = createColumnHelper<ExtraDataRecord>();

const ExtraDataRecordsTable = FastTablePaginated<ExtraDataRecord>;

export interface MinionExtraDataRecordTableProps {
  store: ExtraDataRecordsStore;
  fields: string[];
  category: ExtraDataCategoryModel;
  onFilterButton?: OnFilterButtonHandler;
}

export const MinionExtraDataRecordTable = observer<MinionExtraDataRecordTableProps>(
  function MinionExtraDataRecordTable({ store, fields, category, onFilterButton }) {
    const { t } = useTranslation();

    const columns = useMemo(
      () =>
        fields.map((field) =>
          columnHelper.accessor((row) => row[field], {
            id: field,
            header: field,
            cell: ({ getValue }) => {
              const value = getValue();
              const canFilter =
                !!onFilterButton &&
                (isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive)));

              return (
                <ExtraDataCell
                  value={value}
                  onCopy={() => {}}
                  filterTitle={t("minions.extra-data.apply-to-filters")}
                  onFilter={
                    canFilter
                      ? () =>
                          onFilterButton({
                            name: `extra.${category.source}.${category.name}.${field}`,
                            value,
                            keepDrawerOpen: true,
                          })
                      : undefined
                  }
                />
              );
            },
            meta: {
              minWidth: 160,
            },
          })
        ),
      [fields, onFilterButton, category, t]
    );

    return (
      <ExtraDataRecordsTable
        tableId="core-minion-extra-data-records"
        columns={columns}
        data={toJS(store.records)}
        total={store.totalRecords}
        isLoading={store.isLoading}
        loader={store.recordsLoad}
        pagination={store.pagination}
        sorting={store.sorting}
        onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
        locale={{ empty: t("minions.extra-data.empty") }}
      />
    );
  }
);
