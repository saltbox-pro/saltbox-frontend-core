import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import { COLUMN_MIN_WIDTH_PX, MINION_ID_COLUMN } from "../../../constants/table-view-layout";
import { getColumnWidth } from "../../../helpers/get-column-width";
import type { TableRow } from "../../../model/table-view-types";

import { TableViewCell } from "./table-view-cell";

const columnHelper = createColumnHelper<TableRow>();

export const buildTableViewColumns = (columnNames: string[]): ColumnDef<TableRow>[] => {
  return columnNames.map((columnName) => {
    const width = getColumnWidth(columnName, columnNames);

    return columnHelper.accessor((row) => row[columnName], {
      id: columnName,
      header: columnName,
      enableSorting: false,
      cell: (info) => <TableViewCell value={info.getValue()} columnName={columnName} />,
      meta: {
        ellipsis: columnName !== MINION_ID_COLUMN,
        width,
        minWidth: COLUMN_MIN_WIDTH_PX,
      },
    });
  });
};
