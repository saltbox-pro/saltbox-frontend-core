import { Form, Input } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-title-fields.module.css";

interface TemplateTitleFieldProps {
  store: TemplateEditorStore;
}

export const TemplateTitleField = observer(({ store }: TemplateTitleFieldProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.field}>
      <Form.Item
        className={styles.item}
        layout="vertical"
        colon={false}
        label={t("task-template-editor.title-label")}
        extra={t("task-template-editor.title-hint")}
      >
        <Input
          className={styles.input}
          value={store.templateTitle}
          placeholder={t("task-template-editor.title-placeholder")}
          // Схему со сломанным JSON править из формы некуда
          disabled={store.hasMetaError}
          onChange={(event) => store.setTemplateTitle(event.target.value)}
        />
      </Form.Item>
    </div>
  );
});

export const TemplateDescriptionField = observer(({ store }: TemplateTitleFieldProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.field}>
      <Form.Item
        className={styles.item}
        layout="vertical"
        colon={false}
        label={t("task-template-editor.description-label")}
        extra={t("task-template-editor.description-hint")}
      >
        <Input.TextArea
          className={styles.input}
          value={store.templateDescription}
          placeholder={t("task-template-editor.description-placeholder")}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={store.hasMetaError}
          onChange={(event) => store.setTemplateDescription(event.target.value)}
        />
      </Form.Item>
    </div>
  );
});
