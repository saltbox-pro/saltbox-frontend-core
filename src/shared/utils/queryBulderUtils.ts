import {
  ValueProcessorByRule,
  defaultRuleProcessorJsonLogic,
  defaultRuleProcessorMongoDB,
} from "react-querybuilder";
import dayjs from "dayjs";
import {
  DATETIME_TIMESTAMP,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";

export const customRuleProcessorMongoDB: ValueProcessorByRule = (
  rule,
  options
) => {
  if (
    rule.valueSource !== "field" &&
    [
      "contains",
      "beginswith",
      "endswith",
      "doesnotcontain",
      "doesnotbeginwith",
      "doesnotendwith",
    ].includes(rule.operator)
  ) {
    return defaultRuleProcessorMongoDB(
      { ...rule, value: rule.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") },
      options
    );
  }

  return defaultRuleProcessorMongoDB(rule, options);
};

export const customRuleProcessorJsonLogic: ValueProcessorByRule = (
  rule,
  options
) => {
  if (dayjs.isDayjs(rule.value)) {
    return defaultRuleProcessorJsonLogic(
      { ...rule, value: formatTimeByUserTZ(rule.value, DATETIME_TIMESTAMP) },
      options
    );
  }

  return defaultRuleProcessorJsonLogic(rule, options);
};
