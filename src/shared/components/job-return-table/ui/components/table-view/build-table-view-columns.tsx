import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import type { TableRow } from "../../../model/table-view-types";

import { TableViewCell } from "./table-view-cell";

const columnHelper = createColumnHelper<TableRow>();

export const buildTableViewColumns = (columnNames: string[]): ColumnDef<TableRow>[] => {
  return columnNames.map((columnName) => {
    const cols = columnNames.length;

    return columnHelper.accessor((row) => row[columnName], {
      id: columnName,
      header: columnName,
      enableSorting: false,
      cell: (info) => <TableViewCell value={info.getValue()} columnName={columnName} />,
      meta: {
        maxWidth: 400,
        width: cols > 5 ? (columnName === "minion_id" ? 220 : 150) : `${100 / cols}%`,
      },
    });
  });
};
