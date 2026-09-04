import type { FormInstance } from "antd";
import type { TFunction } from "i18next";

import { isSourceDuplicateNameError } from "./is-source-duplicate-name-error";

const DUPLICATE_NAME_ERROR_KEY = "configuration-templates.source.action.duplicate-name-error";

export async function trySetSourceDuplicateNameFieldError(
  form: Pick<FormInstance, "setFields">,
  error: unknown,
  t: TFunction
): Promise<boolean> {
  if (!(await isSourceDuplicateNameError(error))) {
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
