import type { AppError } from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import type { TFunction } from "i18next";

import { isSourceDuplicateNameError } from "./is-source-duplicate-name-error";

const DUPLICATE_NAME_ERROR_KEY = "configuration-templates.source.action.duplicate-name-error";

export function trySetSourceDuplicateNameFieldError(
  form: Pick<FormInstance, "setFields">,
  error: AppError,
  t: TFunction
): boolean {
  if (!isSourceDuplicateNameError(error)) {
    return false;
  }

  form.setFields([
    {
      name: "name",
      errors: [t(DUPLICATE_NAME_ERROR_KEY)],
    },
  ]);

  return true;
}
