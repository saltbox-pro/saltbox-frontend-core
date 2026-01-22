import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { Table, type TableColumnsType, type TableProps } from "antd";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  convertToTable,
  TableData,
  maxDisplayLength,
  maxFilterOptions,
} from "../utils/table-converter";

import styles from "./table-view.module.css";

interface TableViewProps {
  data: unknown | TableData;
  minionId: string;
  onSortingChange?: OnChangeFn<SortingState>;
  onFilteredDataChange?: (filteredRows: Record<string, unknown>[]) => void;
  onErrorsChange?: (errors: Array<{ minion_id: string; error: string }>) => void;
}

const isEmptyBrackets = (value: unknown): boolean => {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  const stringValue = String(value).trim();
  return stringValue === "[]" || stringValue === "{}";
};

export const TableView: React.FC<TableViewProps> = ({
  data,
  minionId,
  onSortingChange,
  onFilteredDataChange,
  onErrorsChange,
}) => {
  const { t } = useTranslation();
  const [filteredInfo, setFilteredInfo] = useState<Record<string, unknown[] | null>>({});

  const tableData = useMemo(() => {
    if (
      data &&
      typeof data === "object" &&
      "canConvert" in data &&
      "columns" in data &&
      "rows" in data
    ) {
      return data as TableData;
    }
    return convertToTable(data, minionId);
  }, [data, minionId]);

  React.useEffect(() => {
    setFilteredInfo({});
  }, [tableData]);

  React.useEffect(() => {
    if (onErrorsChange && tableData.errors) {
      onErrorsChange(tableData.errors);
    }
  }, [tableData.errors, onErrorsChange]);

  const columns = useMemo<TableColumnsType<Record<string, unknown>>>(() => {
    if (!tableData.canConvert || tableData.columns.length === 0) {
      return [];
    }

    const displayColumns = tableData.columns.filter((col) => col !== "key");

    return displayColumns.map((colName) => {
      const uniqueValues = Array.from(
        new Set(
          tableData.rows
            .map((row) => {
              const value = row[colName];
              if (value === null || value === undefined || value === "" || isEmptyBrackets(value)) {
                return null;
              }
              return String(value);
            })
            .filter((v): v is string => v !== null)
        )
      )
        .sort((a, b) =>
          a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        )
        .slice(0, maxFilterOptions);

      const filters = uniqueValues.map((value) => {
        const displayText =
          value.length > maxDisplayLength ? `${value.slice(0, maxDisplayLength)}...` : value;
        return {
          text: displayText,
          value: value,
        };
      });

      return {
        title: colName,
        dataIndex: colName,
        key: colName,
        filters: filters.length > 0 ? filters : undefined,
        filterSearch: filters.length > 0 ? true : undefined,
        onFilter:
          filters.length > 0
            ? (value: unknown, record: Record<string, unknown>) => {
                const recordValue = record[colName];
                return (
                  recordValue != null && recordValue !== "" && String(recordValue) === String(value)
                );
              }
            : undefined,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
          const aValue = a[colName];
          const bValue = b[colName];
          if (aValue == null || aValue === "") return 1;
          if (bValue == null || bValue === "") return -1;
          return String(aValue).localeCompare(String(bValue), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        },
        render: (value: unknown) => {
          if (value === null || value === undefined || value === "" || isEmptyBrackets(value)) {
            return <span className={styles.emptyCell}>—</span>;
          }
          const stringValue = String(value);
          if (stringValue.length > maxDisplayLength) {
            return <span title={stringValue}>{stringValue.slice(0, maxDisplayLength - 3)}...</span>;
          }
          return <span>{stringValue}</span>;
        },
        width: 150,
        ellipsis: colName !== "minion_id",
      };
    });
  }, [tableData]);

  const filteredRows = useMemo(() => {
    if (!tableData.canConvert) {
      return [];
    }

    const activeFilters = Object.entries(filteredInfo).filter(
      ([, values]) => values && values.length > 0
    );

    if (activeFilters.length === 0) {
      return tableData.rows;
    }

    return tableData.rows.filter((row) => {
      return activeFilters.every(([colName, filterValues]) => {
        const rowValue = row[colName];
        if (rowValue == null || rowValue === "") {
          return false;
        }
        return filterValues!.some((filterValue) => String(rowValue) === String(filterValue));
      });
    });
  }, [tableData, filteredInfo]);

  React.useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredRows);
    }
  }, [filteredRows, onFilteredDataChange]);

  const handleTableChange: TableProps<Record<string, unknown>>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    setFilteredInfo((filters as Record<string, unknown[] | null>) || {});

    if (onSortingChange && sorter) {
      const sorters = Array.isArray(sorter) ? sorter : [sorter];
      const sorting: SortingState = sorters
        .filter((s) => s.order)
        .map((s) => ({
          id: String(s.field),
          desc: s.order === "descend",
        }));
      onSortingChange(sorting);
    }
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(filteredInfo).some(
      (filterValues) => filterValues && filterValues.length > 0
    );
  }, [filteredInfo]);

  if (!tableData.canConvert) {
    return (
      <div className={styles.errorMessage}>
        {t("jobs.table-conversion-error", { reason: tableData.reason || "Unknown error" })}
      </div>
    );
  }

  if (tableData.rows.length === 0) {
    return <div className={styles.emptyMessage}>{t("jobs.table-empty")}</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <Table<Record<string, unknown>>
        columns={columns}
        dataSource={tableData.rows}
        rowKey={(record, index) => (record.key ? String(record.key) : String(index))}
        onChange={handleTableChange}
        pagination={false}
        scroll={{ x: "max-content", y: "calc(100vh - 300px)" }}
        locale={{
          emptyText: hasActiveFilters ? t("jobs.table-no-data-filtered") : t("jobs.table-empty"),
        }}
      />
    </div>
  );
};
