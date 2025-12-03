import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef, createColumnHelper, OnChangeFn, SortingState } from "@tanstack/react-table";
import { Alert, Button, Flex } from "antd";
import { ExclamationCircleOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { FastTableListed } from "@saltbox/saltbox-frontend-common";
import { convertToTable, TableData } from "../utils/table-converter";
import styles from "./table-view.module.css";

const columnHelper = createColumnHelper<Record<string, unknown>>();
const TableViewComponent = FastTableListed<Record<string, unknown>>;

interface TableViewProps {
  data: unknown | TableData;
  minionId: string;
  onSortingChange?: OnChangeFn<SortingState>;
}

export const TableView: React.FC<TableViewProps> = ({ data, minionId, onSortingChange }) => {
  const { t } = useTranslation();
  const [isErrorsCollapsed, setIsErrorsCollapsed] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updaterOrValue) => {
      setSorting((prevSorting) => {
        const nextSorting = typeof updaterOrValue === "function" ? updaterOrValue(prevSorting) : updaterOrValue;
        onSortingChange?.(nextSorting);
        return nextSorting;
      });
    },
    [onSortingChange]
  );

  const tableData = useMemo(() => {
    if (data && typeof data === "object" && "canConvert" in data && "columns" in data && "rows" in data) {
      return data as TableData;
    }
    return convertToTable(data, minionId);
  }, [data, minionId]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!tableData.canConvert || tableData.columns.length === 0) {
      return [];
    }

    return tableData.columns
      .filter((col) => col !== "key")
      .map((colName) =>
        columnHelper.accessor(colName as keyof Record<string, unknown>, {
          header: colName,
          cell: (info) => {
            const value = info.getValue();
            if (value === null || value === undefined || value === "") {
              return <span className={styles.emptyCell}>—</span>;
            }
            const stringValue = String(value);
            if (stringValue.length > 100) {
              return (
                <span title={stringValue}>
                  {stringValue.slice(0, 97)}...
                </span>
              );
            }
            return <span>{stringValue}</span>;
          },
          meta:
            colName === "minion_id"
              ? { tdClassName: "fast-table-column-nowrap" }
              : undefined,
        })
      );
  }, [tableData]);

  if (!tableData.canConvert) {
    return (
      <div className={styles.errorMessage}>
        {t("jobs.table-conversion-error", { reason: tableData.reason || "Unknown error" })}
      </div>
    );
  }

  if (tableData.rows.length === 0) {
    return (
      <div className={styles.emptyMessage}>
        {t("jobs.table-empty")}
      </div>
    );
  }

  const hasErrors = tableData.errors && tableData.errors.length > 0;

  return (
    <div className={styles.tableContainer}>
      {hasErrors && (
        <div className={styles.errorsContainer}>
          <Alert
            message={
              <Flex justify="space-between" align="center">
                <span>{t("jobs.table-errors-found", { count: tableData.errors!.length })}</span>
                <Button
                  type="text"
                  size="small"
                  icon={isErrorsCollapsed ? <DownOutlined /> : <UpOutlined />}
                  onClick={() => setIsErrorsCollapsed(!isErrorsCollapsed)}
                  className={styles.collapseButton}
                  title={isErrorsCollapsed ? t("jobs.table-errors-expand") : t("jobs.table-errors-collapse")}
                />
              </Flex>
            }
            description={
              <div className={`${styles.errorsList} ${isErrorsCollapsed ? styles.errorsListHidden : ""}`}>
                {tableData.errors!.map((error, index) => (
                  <div key={index} className={styles.errorItem}>
                    <span className={styles.errorMinionId}>{error.minion_id}:</span>
                    <span className={styles.errorText}>{error.error}</span>
                  </div>
                ))}
              </div>
            }
            type="warning"
            icon={<ExclamationCircleOutlined />}
            showIcon
            className={styles.errorsAlert}
          />
        </div>
      )}
      <TableViewComponent
        columns={columns}
        data={tableData.rows}
        total={tableData.rows.length}
        isEmpty={tableData.rows.length === 0}
        isLoading={false}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        getRowId={(row, index) => (row.key ? String(row.key) : String(index))}
      />
    </div>
  );
};

