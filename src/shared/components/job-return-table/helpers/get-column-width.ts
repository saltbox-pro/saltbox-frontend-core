import {
  MINION_ID_COLUMN,
  MINION_ID_COLUMN_WIDTH,
  REMAINING_COLUMNS_WIDTH_PERCENT,
} from "../constants/table-view-layout";

export const getColumnWidth = (columnName: string, allColumns: string[]): string => {
  const hasMinionIdColumn = allColumns.includes(MINION_ID_COLUMN);
  const otherColumnsCount = allColumns.filter((column) => column !== MINION_ID_COLUMN).length;

  if (columnName === MINION_ID_COLUMN) {
    return hasMinionIdColumn ? MINION_ID_COLUMN_WIDTH : `${100 / allColumns.length}%`;
  }

  if (hasMinionIdColumn && otherColumnsCount > 0) {
    return `${REMAINING_COLUMNS_WIDTH_PERCENT / otherColumnsCount}%`;
  }

  return `${100 / allColumns.length}%`;
};
