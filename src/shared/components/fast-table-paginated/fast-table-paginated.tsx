import React from "react";
import { useTranslation } from "react-i18next";
import {
  OnChangeFn,
  PaginationState,
  Row,
  RowData,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toJS } from "mobx";
import { Pagination, PaginationProps } from "antd";
import "./fast-table-paginated.css";

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    thClassName?: string;
    tdClassName?: string;
  }
}

export type FastTablePaginatedProps<DataType> = {
  columns: Array<any>;
  data: Array<DataType>;
  total?: number;
  pagination: PaginationState;
  onLazyLoad: (pagination: PaginationState) => void;
  onRowClick?: (
    item: DataType,
    event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  ) => void;
  getRowId?: (
    originalRow: DataType,
    index: number,
    parent?: Row<DataType> | undefined,
  ) => string;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  rowSelection?: RowSelectionState;
};

export function FastTablePaginated<DataType>({
  columns,
  data,
  total,
  pagination,
  onLazyLoad,
  onRowClick,
  getRowId,
  onRowSelectionChange,
  rowSelection,
}: FastTablePaginatedProps<DataType>) {
  const { t } = useTranslation();
  const table = useReactTable({
    columns,
    data,
    getRowId,
    getCoreRowModel: getCoreRowModel<DataType>(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const nextPagination = updater(pagination);
        onLazyLoad(nextPagination);
      }
    },
    state: {
      pagination,
      rowSelection,
    },
    manualPagination: true,
    rowCount: total,
  });

  const showTotal: PaginationProps["showTotal"] = (total) =>
    t("fast-table-paginated.total") + ` ${total}`;

  const handlePaginationChange = (page: number, pageSize: number) => {
    table.setPagination({
      pageIndex: page - 1,
      pageSize,
    });
  };

  const handlePaginationShowSizeChange: (
    current: number,
    pageSize: number,
  ) => void = (current: number, pageSize: number) => {
    table.setPagination({
      pageIndex: current - 1,
      pageSize,
    });
  };

  return (
    <div className="fast-table">
      <div className="fast-table-wrapper">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={header.column.columnDef.meta?.thClassName}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={(event) =>
                  onRowClick ? onRowClick(toJS(row.original), event) : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cell.column.columnDef.meta?.tdClassName}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="fast-table-summary">
        <div className="fast-table-pagination">
          <Pagination
            size="small"
            total={total}
            showTotal={showTotal}
            showSizeChanger
            pageSizeOptions={[10, 50, 100, 1000]}
            defaultPageSize={50}
            showQuickJumper
            onChange={handlePaginationChange}
            onShowSizeChange={handlePaginationShowSizeChange}
            locale={{
              items_per_page: t("fast-table-paginated.items-per-page"),
              jump_to: t("fast-table-paginated.jump-to"),
              jump_to_confirm: t("fast-table-paginated.jump-to-confirm"),
              page: t("fast-table-paginated.page"),
              prev_page: t("fast-table-paginated.prev-page"),
              next_page: t("fast-table-paginated.next-page"),
              prev_5: t("fast-table-paginated.prev-5"),
              next_5: t("fast-table-paginated.next-5"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
