import { toExtraDataCopyValue } from "saltbox-core/shared/helpers/extra-data-value";

import type { ExtraDataRecordSummary } from "../types/extra-data-record-summary";

const RECORD_SUMMARY_FIELDS_LIMIT = 10;

export function getExtraDataRecordSummary(
  fields: string[],
  record: Record<string, unknown>
): ExtraDataRecordSummary {
  return {
    entries: fields
      .slice(0, RECORD_SUMMARY_FIELDS_LIMIT)
      .map((name) => ({ name, value: toExtraDataCopyValue(record[name]) })),
    hiddenCount: Math.max(fields.length - RECORD_SUMMARY_FIELDS_LIMIT, 0),
  };
}
