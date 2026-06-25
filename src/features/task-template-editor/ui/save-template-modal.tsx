import { Form, Input, Modal, Select, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

interface SaveTemplateModalProps {
  store: TemplateEditorStore;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SaveTemplateModal = observer(
  ({ store, open, onCancel, onConfirm }: SaveTemplateModalProps) => {
    const { t } = useTranslation();

    const hasTargetSources = store.targetSources.length > 0;

    return (
      <Modal
        title={t("task-template-editor.save-modal-title")}
        open={open}
        onCancel={onCancel}
        onOk={onConfirm}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        okButtonProps={{ loading: store.isSaving, disabled: !store.canSave }}
        cancelButtonProps={{ disabled: store.isSaving }}
        maskClosable={!store.isSaving}
        destroyOnHidden
      >
        {store.isDuplicate ? (
          <Form layout="vertical">
            <Form.Item label={t("task-template-editor.duplicate-target-label")} required>
              <Select
                placeholder={t("task-template-editor.duplicate-target-placeholder")}
                value={store.targetSourceId ?? undefined}
                onChange={(value) => store.setTargetSourceId(value)}
                loading={store.isLoadingTargetSources}
                disabled={store.isSaving || !hasTargetSources}
                options={store.targetSources.map((source) => ({
                  value: source.id,
                  label: source.name,
                }))}
                notFoundContent={t("task-template-editor.duplicate-no-local-sources")}
              />
            </Form.Item>

            <Form.Item label={t("task-template-editor.file-name-label")} required>
              <Input
                autoFocus
                placeholder={t("task-template-editor.file-name-placeholder")}
                value={store.fileName}
                onChange={(event) => store.setFileName(event.target.value)}
                onPressEnter={() => {
                  if (store.canSave) onConfirm();
                }}
              />
            </Form.Item>
          </Form>
        ) : (
          <>
            <Typography.Paragraph type="secondary">
              {t("task-template-editor.save-modal-target")}{" "}
              <Typography.Text strong>
                {store.sourceName ?? t("task-template-editor.save-modal-target-fallback")}
              </Typography.Text>
            </Typography.Paragraph>

            {store.createsNewTemplate ? (
              <Form layout="vertical">
                <Form.Item label={t("task-template-editor.file-name-label")} required>
                  <Input
                    autoFocus
                    placeholder={t("task-template-editor.file-name-placeholder")}
                    value={store.fileName}
                    onChange={(event) => store.setFileName(event.target.value)}
                    onPressEnter={() => {
                      if (store.canSave) onConfirm();
                    }}
                  />
                </Form.Item>
              </Form>
            ) : (
              <Typography.Paragraph type="secondary">
                {t("task-template-editor.save-modal-update-info")}{" "}
                <Typography.Text strong>{store.fileName}</Typography.Text>
              </Typography.Paragraph>
            )}
          </>
        )}
      </Modal>
    );
  }
);
