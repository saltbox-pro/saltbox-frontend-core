import { FilterOutlined } from "@ant-design/icons";
import { GrainValue } from "@saltbox/saltbox-core-api-client";
import { FastTableListed } from "@saltbox/saltbox-frontend-common";
import { SortingState, createColumnHelper } from "@tanstack/react-table";
import { CSSProperties, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MinionFilterStore } from "saltbox-core/store";

import { applyFieldValueFilter } from "../../helpers/apply-filter";
import { formatPercent } from "../../helpers/format-percent";
import { getChartTotal } from "../../helpers/get-chart-total";
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

  const maxCount = useMemo(
    () => values.reduce((max, item) => Math.max(max, item.count), 0),
    [values]
  );
  const total = useMemo(() => getChartTotal(values), [values]);

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
              onClick: (value) => applyFieldValueFilter(filterStore, fieldSource, value),
            },
          ],
          tdClassName: styles.grainValueCol,
        },
      }),
      columnHelper.accessor("count", {
        header: t("dashboard.table-count"),
        enableColumnFilter: false,
        meta: {
          tdClassName: styles.grainCountCol,
        },
        cell: (data) => {
          const count = data.getValue();
          const ratio = maxCount > 0 ? count / maxCount : 0;
          return (
            <>
              <span
                className={styles.grainCountBar}
                style={{ "--grain-count-bar-width": `${ratio * 100}%` } as CSSProperties}
              />
              <span className={styles.grainCountValue}>{count}</span>
              <span className={styles.grainCountPercent}>({formatPercent(count, total)})</span>
            </>
          );
        },
      }),
    ],
    [t, fieldSource, filterStore, maxCount, total]
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
