import { Alert, Form, Modal, Select, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { hasBlockingIssues, validateMeta } from "../helpers/validate-meta";
import type { TemplateEditorStore } from "../model/template-editor-store";

import { DuplicateNoConnectedLocalSourceAlert } from "./duplicate-no-connected-local-source-alert";
import styles from "./save-template-modal.module.css";

interface SaveTemplateModalProps {
  store: TemplateEditorStore;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

type SaveTemplateFormValues = {
  targetSourceId?: string;
};

export const SaveTemplateModal = observer(
  ({ store, open, onCancel, onConfirm }: SaveTemplateModalProps) => {
    const { t } = useTranslation();
    const [form] = Form.useForm<SaveTemplateFormValues>();

    const hasTargetSources = store.targetSources.length > 0;
    const showNoConnectedLocalSourceAlert =
      store.isDuplicate && !store.isLoadingTargetSources && !hasTargetSources;

    const meta = store.meta;
    const issues = useMemo(() => (meta ? validateMeta(meta) : []), [meta]);
    const isBlocked = hasBlockingIssues(issues);

    useEffect(() => {
      if (open) {
        form.setFieldsValue({ targetSourceId: store.targetSourceId ?? undefined });
      }
    }, [open, form, store.targetSourceId]);

    const handleOk = async () => {
      if (!store.isDuplicate) {
        onConfirm();
        return;
      }

      try {
        const values = await form.validateFields();
        store.setTargetSourceId(values.targetSourceId ?? null);
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
          disabled: store.isSaving || isBlocked || (store.isDuplicate && !hasTargetSources),
        }}
        cancelButtonProps={{ disabled: store.isSaving }}
        maskClosable={!store.isSaving}
        destroyOnHidden
      >
        {issues.length > 0 && (
          <Alert
            className={styles.warning}
            type={isBlocked ? "error" : "warning"}
            showIcon
            message={t(
              isBlocked
                ? "task-template-editor.meta-issues-blocking"
                : "task-template-editor.meta-issues-warning"
            )}
            description={
              <ul className={styles.issueList}>
                {issues.map((issue, index) => (
                  <li key={`${issue.key}-${index}`}>
                    {t(`task-template-editor.${issue.key}`, issue.params)}
                  </li>
                ))}
              </ul>
            }
          />
        )}

        {store.willDeleteSls && (
          <Alert
            className={styles.warning}
            type="warning"
            showIcon
            message={t("task-template-editor.sls-will-be-deleted")}
            description={t("task-template-editor.sls-will-be-deleted-description", {
              fun: store.fun,
            })}
          />
        )}

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
          </Form>
        ) : (
          <>
            <Typography.Paragraph type="secondary">
              {t("task-template-editor.save-modal-target")}{" "}
              <Typography.Text strong>
                {store.sourceName ?? t("task-template-editor.save-modal-target-fallback")}
              </Typography.Text>
            </Typography.Paragraph>

            <Typography.Paragraph type="secondary">
              {store.createsNewTemplate
                ? t("task-template-editor.save-modal-create-info")
                : t("task-template-editor.save-modal-update-info")}{" "}
              <Typography.Text strong>{store.fileName}</Typography.Text>
            </Typography.Paragraph>
          </>
        )}
      </Modal>
    );
  }
);
