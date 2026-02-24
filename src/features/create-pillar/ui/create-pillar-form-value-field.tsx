import { JsonEditor } from "@saltbox/saltbox-frontend-common";
import { FormInstance } from "antd";
import type { ComponentProps } from "react";

import styles from "./create-pillar-form-value-field.module.css";

export function JsonEditorField({
  form,
  ...editorProps
}: ComponentProps<typeof JsonEditor> & { form: FormInstance }) {
  const errors = form.getFieldError("value");
  const hasError = Array.isArray(errors) && errors.length > 0;

  return (
    <div
      className={`${styles.jsonEditorWrapper} ${hasError ? styles.jsonEditorWrapper_error : ""}`}
    >
      <JsonEditor {...editorProps} />
    </div>
  );
}
