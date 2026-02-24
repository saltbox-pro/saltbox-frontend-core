import type { RuleObject } from "antd/es/form";
import type { TFunction } from "i18next";

import { isParseValueError, parseAndValidatePillarValue } from "./validation";

export function createPillarValueValidator(t: TFunction): NonNullable<RuleObject["validator"]> {
  return (_, raw) => {
    if (!raw?.trim()) return Promise.resolve();

    const result = parseAndValidatePillarValue(raw ?? "");

    if (isParseValueError(result)) {
      return Promise.reject(new Error(t(result.errorKey)));
    }

    return Promise.resolve();
  };
}
