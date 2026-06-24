import { JsonPreview } from "saltbox-core/shared/components/json-preview";

import { JSON_PREVIEW_MAX_ENTRIES } from "../../../constants/table-view-layout";
import {
  isEmptyTableCellValue,
  normalizeTableCellValue,
} from "../../../helpers/format-table-cell-value";

import styles from "./table-view-cell.module.css";

type TableViewCellProps = {
  value: unknown;
  columnName: string;
};

export function TableViewCell({ value, columnName }: TableViewCellProps) {
  if (isEmptyTableCellValue(value)) {
    return null;
  }

  const displayValue = normalizeTableCellValue(value);

  if (typeof displayValue === "object" && displayValue !== null) {
    return (
      <div className={styles.jsonPreviewCell}>
        <JsonPreview
          value={displayValue}
          title={columnName}
          maxPreviewEntries={JSON_PREVIEW_MAX_ENTRIES}
          popoverPlacement="bottomRight"
        />
      </div>
    );
  }

  return <span className={styles.plainCell}>{String(displayValue)}</span>;
}
