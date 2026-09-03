import { Form, Input, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getTemplateFileNameErrorKey } from "../helpers/validate-template-file-name";
import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-file-name-field.module.css";

interface TemplateFileNameFieldProps {
  store: TemplateEditorStore;
}

export const TemplateFileNameField = observer(({ store }: TemplateFileNameFieldProps) => {
  const { t } = useTranslation();

  const [isTouched, setTouched] = useState(false);

  const errorKey = store.createsNewTemplate ? getTemplateFileNameErrorKey(store.fileName) : null;
  const showError = isTouched && errorKey !== null;

  return (
    <div className={styles.field}>
      <Form.Item
        className={styles.item}
        layout="vertical"
        colon={false}
        label={t("task-template-editor.file-name-label")}
        extra={store.createsNewTemplate ? t("task-template-editor.file-name-hint") : undefined}
        validateStatus={store.createsNewTemplate && showError ? "error" : undefined}
        help={store.createsNewTemplate && showError && errorKey ? t(errorKey) : undefined}
      >
        {!store.createsNewTemplate ? (
          <Typography.Text strong className={styles.value}>
            {store.fileName}
          </Typography.Text>
        ) : (
          <Input
            className={styles.input}
            value={store.fileName}
            placeholder={t("task-template-editor.file-name-placeholder")}
            onChange={(event) => {
              setTouched(true);
              store.setFileName(event.target.value);
            }}
            onBlur={() => setTouched(true)}
          />
        )}
      </Form.Item>
    </div>
  );
});
