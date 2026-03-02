import type { RuleObject } from "antd/es/form";
import type { TFunction } from "i18next";

import { isParseValueError, parseAndValidateJsonValue } from "./validation";

export function createJsonValueValidator(t: TFunction): NonNullable<RuleObject["validator"]> {
  return (_, raw) => {
    if (!raw?.trim()) return Promise.resolve();

    const result = parseAndValidateJsonValue(raw ?? "");

    if (isParseValueError(result)) {
      return Promise.reject(new Error(t(result.errorKey)));
    }

    return Promise.resolve();
  };
}
