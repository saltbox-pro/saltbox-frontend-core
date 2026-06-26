import { FilterOutlined } from "@ant-design/icons";
import { GrainValue } from "@saltbox/saltbox-core-api-client";
import { FastTableListed } from "@saltbox/saltbox-frontend-common";
import { SortingState, createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MinionFilterStore } from "saltbox-core/store";

import { valueToText } from "../../model/dashboard-chart-data";

import styles from "./grain-table.module.css";

const columnHelper = createColumnHelper<GrainValue>();

type GrainTableProps = {
  values: GrainValue[];
  fieldSource: string;
  filterStore: MinionFilterStore;
};

export const GrainTable = ({ values, fieldSource, filterStore }: GrainTableProps) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([{ id: "count", desc: true }]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("value", {
        header: t("dashboard.table-value"),
        enableSorting: false,
        cell: (data) => <span>{valueToText(data.getValue(), t("dashboard.empty-name"))}</span>,
        meta: {
          showCopy: true,
          actions: [
            {
              icon: <FilterOutlined />,
              title: t("dashboard.apply-value-to-filters"),
              onClick: (value) => {
                filterStore.addFilter({
                  field: fieldSource,
                  operator: "=",
                  valueSource: "value",
                  value: String(value ?? ""),
                });
                filterStore.handleSearch();
              },
            },
          ],
          tdClassName: styles.grainValueCol,
        },
      }),
      columnHelper.accessor("count", {
        header: t("dashboard.table-count"),
        enableColumnFilter: false,
      }),
    ],
    [t, fieldSource, filterStore]
  );

  if (values.length === 0) {
    return <div>{t("dashboard.no-information")}</div>;
  }

  return (
    <FastTableListed
      columns={columns}
      data={values}
      isEmpty={!values.length}
      sorting={sorting}
      onSortingChange={setSorting}
      hideFooter
    />
  );
};
