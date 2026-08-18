import { SaveOutlined } from "@ant-design/icons";
import { Button, Input, Tooltip, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getTemplateFileNameErrorKey } from "../helpers/validate-template-file-name";
import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-editor-header.module.css";
import { TemplateFunctionField } from "./template-function-field";

interface TemplateEditorHeaderProps {
  store: TemplateEditorStore;
  onSave: () => void;
}

export const TemplateEditorHeader = observer(({ store, onSave }: TemplateEditorHeaderProps) => {
  const { t } = useTranslation();
  const [isFileNameTouched, setFileNameTouched] = useState(false);

  const fileNameErrorKey = store.createsNewTemplate
    ? getTemplateFileNameErrorKey(store.fileName)
    : null;
  const showFileNameError = isFileNameTouched && fileNameErrorKey !== null;

  return (
    <div className={styles.header}>
      <div className={styles.mainFields}>
        <div className={styles.fileName}>
          <Typography.Text type="secondary" className={styles.label}>
            {t("task-template-editor.file-name-label")}
          </Typography.Text>

          {store.createsNewTemplate ? (
            <>
              <Input
                className={styles.fileNameInput}
                value={store.fileName}
                status={showFileNameError ? "error" : undefined}
                placeholder={t("task-template-editor.file-name-placeholder")}
                onChange={(event) => {
                  setFileNameTouched(true);
                  store.setFileName(event.target.value);
                }}
                onBlur={() => setFileNameTouched(true)}
              />
              {showFileNameError && (
                <Typography.Text type="danger" className={styles.error}>
                  {t(fileNameErrorKey)}
                </Typography.Text>
              )}
            </>
          ) : (
            <Typography.Text strong className={styles.fileNameValue}>
              {store.fileName}
            </Typography.Text>
          )}
        </div>

        <TemplateFunctionField store={store} />
      </div>

      <div className={styles.save}>
        <Tooltip
          title={store.isLegacyTemplate ? t("task-template-editor.legacy-blocks-save") : undefined}
        >
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={store.hasMetaError || store.isLegacyTemplate || fileNameErrorKey !== null}
            onClick={onSave}
          >
            {t("common.save")}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});
