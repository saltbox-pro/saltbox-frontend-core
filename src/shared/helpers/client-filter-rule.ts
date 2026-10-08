import {
  normalizeDatetimeFilterValue,
  type FilterFieldOptions,
} from "@saltbox/saltbox-frontend-common";

import { isFilterPrimitive } from "saltbox-core/shared/helpers/extra-data-value";

type ClientFilterRuleValue = string | boolean | number;

export function getClientFilterActionTitle(active: boolean, t: (key: string) => string): string {
  return active ? t("minions.action-button.remove-filter") : t("minions.action-button.add-filter");
}

export type ClientFilterRule = {
  field: string;
  operator: string;
  value: ClientFilterRuleValue;
};

function toClientFilterRuleValue(
  value: string | number | boolean,
  options: Pick<FilterFieldOptions, "isDatetime" | "isCheckbox">
): ClientFilterRuleValue {
  if (options.isDatetime) {
    return normalizeDatetimeFilterValue(value);
  }
  if (options.isCheckbox && typeof value === "boolean") {
    return value;
  }
  return String(value);
}

export function buildClientFilterRule(
  field: string,
  value: unknown,
  options: FilterFieldOptions
): ClientFilterRule | null {
  if (value == null) {
    if (!options.supportsNull) {
      return null;
    }

    return { field, operator: "null", value: "" };
  }

  if (value === "") {
    return { field, operator: "=", value: "" };
  }

  if (Array.isArray(value)) {
    if (value.length === 0 || !value.every(isFilterPrimitive)) {
      return null;
    }

    return {
      field,
      operator: "in",
      value: value.map((item) => toClientFilterRuleValue(item, options)).join(","),
    };
  }

  if (!isFilterPrimitive(value)) {
    return null;
  }

  return {
    field,
    operator: "=",
    value: toClientFilterRuleValue(value, options),
  };
}
