import { JsonEditor } from "@saltbox/saltbox-frontend-common";
import { FormInstance } from "antd";
import { type ComponentProps, useMemo } from "react";

import styles from "./json-editor-field.module.css";

interface JsonEditorFieldProps extends ComponentProps<typeof JsonEditor> {
  form: FormInstance;
}

export function JsonEditorField({
  form,
  disabled,
  editorOptions,
  ...editorProps
}: JsonEditorFieldProps) {
  const errors = form.getFieldError("value");
  const hasError = Array.isArray(errors) && errors.length > 0;

  const mergedEditorOptions = useMemo(
    () => ({
      ...editorOptions,
      scrollbar: {
        ...(editorOptions?.scrollbar ?? {}),
        alwaysConsumeMouseWheel: false,
      },
    }),
    [editorOptions]
  );

  return (
    <div
      className={`${styles.jsonEditorWrapper} ${disabled || hasError ? styles.jsonEditorWrapper_disabled : ""}`}
    >
      <JsonEditor disabled={disabled} editorOptions={mergedEditorOptions} {...editorProps} />
    </div>
  );
}
