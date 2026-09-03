import { SaveOutlined } from "@ant-design/icons";
import { Button, Form, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { isValidTemplateFileName } from "../helpers/validate-template-file-name";
import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-editor-header.module.css";
import { TemplateFileNameField } from "./template-file-name-field";
import { TemplateDescriptionField, TemplateTitleField } from "./template-title-fields";

interface TemplateEditorHeaderProps {
  store: TemplateEditorStore;
  onSave: () => void;
}

export const TemplateEditorHeader = observer(({ store, onSave }: TemplateEditorHeaderProps) => {
  const { t } = useTranslation();

  const isFileNameInvalid = store.createsNewTemplate && !isValidTemplateFileName(store.fileName);

  return (
    <div className={styles.header}>
      <div className={styles.mainFields}>
        <TemplateFileNameField store={store} />
        <TemplateTitleField store={store} />
        <TemplateDescriptionField store={store} />
      </div>

      {/* Лейбл-распорка повторяет разметку полей, чтобы кнопка встала на линию
          инпутов. Внутри неразрывный пробел: пустой элемент даёт строку другой
          высоты, и кнопка уезжает вниз */}
      <Form.Item
        className={styles.actions}
        layout="vertical"
        colon={false}
        label={<span aria-hidden="true">&nbsp;</span>}
      >
        <Tooltip
          title={store.isLegacyTemplate ? t("task-template-editor.legacy-blocks-save") : undefined}
        >
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={
              store.hasMetaError || store.isLegacyTemplate || isFileNameInvalid || !store.isFunValid
            }
            onClick={onSave}
          >
            {t("common.save")}
          </Button>
        </Tooltip>
      </Form.Item>
    </div>
  );
});
