import { Form, Modal, Select, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import { DuplicateNoConnectedLocalSourceAlert } from "./duplicate-no-connected-local-source-alert";
import { TemplateFileNameField } from "./template-file-name-field";

interface SaveTemplateModalProps {
  store: TemplateEditorStore;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

type SaveTemplateFormValues = {
  fileName?: string;
  targetSourceId?: string;
};

export const SaveTemplateModal = observer(
  ({ store, open, onCancel, onConfirm }: SaveTemplateModalProps) => {
    const { t } = useTranslation();
    const [form] = Form.useForm<SaveTemplateFormValues>();

    const hasTargetSources = store.targetSources.length > 0;
    const showNoConnectedLocalSourceAlert =
      store.isDuplicate && !store.isLoadingTargetSources && !hasTargetSources;

    useEffect(() => {
      if (open) {
        form.setFieldsValue({
          fileName: store.fileName,
          targetSourceId: store.targetSourceId ?? undefined,
        });
      }
    }, [open, form, store.fileName, store.targetSourceId]);

    const applyFormValues = (values: SaveTemplateFormValues) => {
      if (values.fileName !== undefined) {
        store.setFileName(values.fileName);
      }
      if (store.isDuplicate) {
        store.setTargetSourceId(values.targetSourceId ?? null);
      }
    };

    const handleOk = async () => {
      if (!store.createsNewTemplate) {
        onConfirm();
        return;
      }

      try {
        const values = await form.validateFields();
        applyFormValues(values);
        onConfirm();
      } catch {}
    };

    return (
      <Modal
        title={t("task-template-editor.save-modal-title")}
        open={open}
        width={600}
        onCancel={onCancel}
        onOk={handleOk}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        okButtonProps={{
          loading: store.isSaving,
          disabled: store.isSaving || (store.isDuplicate && !hasTargetSources),
        }}
        cancelButtonProps={{ disabled: store.isSaving }}
        maskClosable={!store.isSaving}
        destroyOnHidden
      >
        {store.isDuplicate ? (
          <Form form={form} layout="vertical">
            {showNoConnectedLocalSourceAlert && <DuplicateNoConnectedLocalSourceAlert />}

            <Form.Item
              name="targetSourceId"
              label={t("task-template-editor.duplicate-target-label")}
              rules={[
                {
                  required: true,
                  message: t("task-template-editor.duplicate-target-placeholder"),
                },
              ]}
            >
              <Select
                placeholder={t("task-template-editor.duplicate-target-placeholder")}
                loading={store.isLoadingTargetSources}
                disabled={store.isSaving || !hasTargetSources}
                options={store.targetSources.map((source) => ({
                  value: source.id,
                  label: source.name,
                }))}
                notFoundContent={t("task-template-editor.duplicate-no-local-sources")}
              />
            </Form.Item>

            <TemplateFileNameField onSubmit={handleOk} />
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
              <Form form={form} layout="vertical">
                <TemplateFileNameField onSubmit={handleOk} />
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
