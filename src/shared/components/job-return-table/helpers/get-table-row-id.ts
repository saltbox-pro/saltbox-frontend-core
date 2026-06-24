import { MINION_ID_COLUMN } from "../constants/table-view-layout";
import type { TableRow } from "../model/table-view-types";

export const getTableRowId = (row: TableRow, index: number): string => {
  const minionId = row[MINION_ID_COLUMN];
  if (typeof minionId === "string" && minionId.length > 0) {
    return `${minionId}-${index}`;
  }
  return `row-${index}`;
};
