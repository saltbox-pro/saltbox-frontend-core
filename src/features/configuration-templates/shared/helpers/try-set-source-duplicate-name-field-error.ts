import type { AppError } from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";
import type { TFunction } from "i18next";

import { isSourceDuplicateNameError } from "./is-source-duplicate-name-error";

const UNIQUE_CONSTRAINT_FIELD_PATTERN = /Unique constraint failed for: \((\w+)=/;

const DUPLICATE_NAME_ERROR_KEY = "configuration-templates.source.action.duplicate-name-error";
const DUPLICATE_NAMESPACE_ERROR_KEY =
  "configuration-templates.source.action.duplicate-namespace-error";

function getUniqueConstraintField(error: AppError): string | undefined {
  return error.serverMessage?.match(UNIQUE_CONSTRAINT_FIELD_PATTERN)?.[1];
}

export function trySetSourceDuplicateNameFieldError(
  form: Pick<FormInstance, "setFields">,
  error: AppError,
  t: TFunction
): boolean {
  if (!isSourceDuplicateNameError(error)) {
    return false;
  }

  const field = getUniqueConstraintField(error);

  if (field === "namespace") {
    form.setFields([
      {
        name: "namespace",
        errors: [t(DUPLICATE_NAMESPACE_ERROR_KEY)],
      },
    ]);
    return true;
  }

  if (field === undefined || field === "name") {
    form.setFields([
      {
        name: "name",
        errors: [t(DUPLICATE_NAME_ERROR_KEY)],
      },
    ]);
    return true;
  }

  return false;
}
