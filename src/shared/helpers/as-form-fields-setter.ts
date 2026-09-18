import type { FormFieldsSetter } from "@saltbox/saltbox-frontend-common";
import type { FormInstance } from "antd";

export const asFormFieldsSetter = <T>(form: FormInstance<T>): FormFieldsSetter => ({
  setFields: (fields) => form.setFields(fields as Parameters<FormInstance<T>["setFields"]>[0]),
});
