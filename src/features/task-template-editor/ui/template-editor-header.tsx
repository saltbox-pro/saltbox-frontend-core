import { SaveOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { isValidTemplateFileName } from "../helpers/validate-template-file-name";
import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-editor-header.module.css";
import { TemplateFileNameField } from "./template-file-name-field";
import { TemplateFunctionField } from "./template-function-field";

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
        <TemplateFunctionField store={store} />
      </div>

      <div className={styles.save}>
        <Tooltip
          title={store.isLegacyTemplate ? t("task-template-editor.legacy-blocks-save") : undefined}
        >
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={
              store.hasMetaError ||
              store.isLegacyTemplate ||
              store.isFunctionSchemaApplying ||
              store.pendingFunctionChange !== null ||
              isFileNameInvalid ||
              !store.isFunValid
            }
            onClick={onSave}
          >
            {t("common.save")}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});
