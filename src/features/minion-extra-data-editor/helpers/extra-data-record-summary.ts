import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";

import { toExtraDataCopyValue } from "saltbox-core/shared/helpers/extra-data-value";

const RECORD_SUMMARY_FIELDS_LIMIT = 3;
const RECORD_SUMMARY_VALUE_MAX_LENGTH = 80;

function truncateSummaryValue(value: string): string {
  return value.length > RECORD_SUMMARY_VALUE_MAX_LENGTH
    ? `${value.slice(0, RECORD_SUMMARY_VALUE_MAX_LENGTH)}…`
    : value;
}

export function getExtraDataRecordSummary(
  category: ExtraDataCategoryModel,
  record: Record<string, unknown>
): string {
  return (category.fields ?? [])
    .filter((field) => record[field.name] !== undefined)
    .slice(0, RECORD_SUMMARY_FIELDS_LIMIT)
    .map(
      (field) => `${field.name}: ${truncateSummaryValue(toExtraDataCopyValue(record[field.name]))}`
    )
    .join("\n");
}
