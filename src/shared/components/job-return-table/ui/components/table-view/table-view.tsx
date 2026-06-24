import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { Alert } from "antd";
import { useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";

import { getMinionIdGroupKey } from "../../../helpers/get-minion-id-group-key";
import { getTableRowId } from "../../../helpers/get-table-row-id";
import type { BackendTableViewProps, TableRow } from "../../../model/table-view-types";

import { buildTableViewColumns } from "./build-table-view-columns";
import styles from "./table-view.module.css";

const JobReturnDataTable = FastTablePaginated<TableRow>;

export const TableView: FC<BackendTableViewProps> = ({
  columns,
  rows,
  total,
  pagination,
  isLoading,
  loadError,
  onLazyLoad,
  isInfoAlertVisible = true,
  onInfoAlertClose,
}) => {
  const { t } = useTranslation();
  const tableColumns = useMemo(() => buildTableViewColumns(columns), [columns]);

  return (
    <div className={styles.tableContainer}>
      {loadError && (
        <Alert
          className={styles.infoAlert}
          type="error"
          showIcon
          message={t("jobs.table-view-load-error")}
        />
      )}

      {isInfoAlertVisible && (
        <Alert
          className={styles.infoAlert}
          type="info"
          showIcon
          closable
          onClose={onInfoAlertClose}
          message={`${t("jobs.table-view-info-total", { count: total })} ${t("jobs.table-view-info-success-only")}`}
        />
      )}

      <JobReturnDataTable
        columns={tableColumns}
        data={rows}
        total={total}
        isLoading={isLoading}
        pagination={pagination}
        onLazyLoad={onLazyLoad}
        getRowId={getTableRowId}
        getRowGroupKey={getMinionIdGroupKey}
        useVirtualScroll
        locale={{
          total: t("jobs.table-view-pagination-total-label"),
          empty: "",
        }}
      />
    </div>
  );
};
