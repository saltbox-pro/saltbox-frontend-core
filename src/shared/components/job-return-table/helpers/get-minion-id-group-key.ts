import { MINION_ID_COLUMN } from "../constants/table-view-layout";
import type { TableRow } from "../model/table-view-types";

export const getMinionIdGroupKey = (row: TableRow): string => {
  const minionId = row[MINION_ID_COLUMN];
  if (typeof minionId === "string") {
    return minionId;
  }
  if (minionId == null) {
    return "";
  }
  return String(minionId);
};
