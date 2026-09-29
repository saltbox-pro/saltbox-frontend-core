import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

import { toExtraDataCopyValue } from "saltbox-core/shared/helpers/extra-data-value";

import type { ExtraDataRecordSummaryEntry } from "../types/extra-data-record-summary";

const RECORD_SUMMARY_FIELDS_LIMIT = 3;

export function getExtraDataRecordSummaryEntries(
  category: ExtraDataCategoryModel,
  record: Record<string, unknown>
): ExtraDataRecordSummaryEntry[] {
  return (category.fields ?? [])
    .filter((field) => record[field.name] !== undefined)
    .slice(0, RECORD_SUMMARY_FIELDS_LIMIT)
    .map((field) => ({ name: field.name, value: toExtraDataCopyValue(record[field.name]) }));
}
