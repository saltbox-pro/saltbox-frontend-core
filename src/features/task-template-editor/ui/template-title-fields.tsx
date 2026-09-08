import { Form, Input } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-title-fields.module.css";

interface TemplateTitleFieldProps {
  store: TemplateEditorStore;
}

/**
 * Ошибка названия. Вторая ветка — про имя файла: в базовом режиме оно выведено
 * из названия, поле «Имя файла» скрыто, и показать невыводимое имя больше негде.
 */
const getTitleErrorKey = (store: TemplateEditorStore): string | null => {
  if (!store.isTitleValid) return "task-template-editor.title-required";

  if (store.createsNewTemplate && !store.isAdvancedMode && !store.isFileNameValid) {
    return "task-template-editor.title-file-name-underivable";
  }

  return null;
};

export const TemplateTitleField = observer(({ store }: TemplateTitleFieldProps) => {
  const { t } = useTranslation();

  const [isTouched, setTouched] = useState(false);

  const errorKey = getTitleErrorKey(store);
  const showError = isTouched && errorKey !== null;

  return (
    <div className={styles.field}>
      <Form.Item
        className={styles.item}
        layout="vertical"
        colon={false}
        label={t("task-template-editor.title-label")}
        extra={t("task-template-editor.title-hint")}
        validateStatus={showError ? "error" : undefined}
        help={showError && errorKey ? t(errorKey) : undefined}
      >
        <Input
          className={styles.input}
          value={store.templateTitle}
          placeholder={t("task-template-editor.title-placeholder")}
          // Схему со сломанным JSON править из формы некуда
          disabled={store.hasMetaError}
          onChange={(event) => {
            setTouched(true);
            store.setTemplateTitle(event.target.value);
          }}
          onBlur={() => setTouched(true)}
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
