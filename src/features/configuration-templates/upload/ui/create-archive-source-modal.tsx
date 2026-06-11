import { InboxOutlined } from "@ant-design/icons";
import { Modal, getApiErrorMessage, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Alert, Form, Upload, type UploadFile, message } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ConfigurationTemplatesStore } from "../../list/store/configuration-templates-store";
import {
  TEMPLATE_SOURCE_ARCHIVE_ACCEPT,
  TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL,
  trimOptional,
  trimRequired,
} from "../constants/template-source-form";

import { CreateTemplateSourceModalFooter } from "./create-template-source-modal-footer";
import { TemplateSourceNameDescriptionFields } from "./template-source-name-description-fields";

const FORM_ID = "archive-source-form";
const I18N_PREFIX = "configuration-templates.archive-source-modal";
const { Dragger } = Upload;

type ArchiveSourceFormValues = {
  name: string;
  description?: string;
  file: UploadFile[];
};

type CreateArchiveSourceModalProps = {
  open: boolean;
  store: ConfigurationTemplatesStore;
  onClose: () => void;
};

export const CreateArchiveSourceModal = observer(function CreateArchiveSourceModal({
  open,
  store,
  onClose,
}: CreateArchiveSourceModalProps) {
  const { t } = useTranslation();

  const [form] = Form.useForm<ArchiveSourceFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setApiError(null);
    }
  }, [open, form]);

  const uploadProps = useMemo(
    () => ({
      multiple: false,
      maxCount: 1,
      beforeUpload: () => false,
      accept: TEMPLATE_SOURCE_ARCHIVE_ACCEPT,
    }),
    []
  );

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleFinish = async (values: ArchiveSourceFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const name = trimRequired(values.name);
      const fileObj = values.file?.[0]?.originFileObj;

      if (!fileObj) {
        messageApi.error(t(`${I18N_PREFIX}.file-required`));
        return;
      }

      await store.createArchiveSource({
        name,
        description: trimOptional(values.description),
        file: fileObj,
      });

      messageApi.success(t(`${I18N_PREFIX}.create-success`, { name }));
      onClose();
    } catch (reason) {
      console.error("Failed to create archive template source:", reason);
      if (isGlobalServerError(reason)) return;

      setApiError(await getApiErrorMessage(reason, t(`${I18N_PREFIX}.create-error`)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Modal
        title={t(`${I18N_PREFIX}.title`)}
        open={open}
        onCancel={handleCancel}
        destroyOnHidden
        footer={
          <CreateTemplateSourceModalFooter
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            cancelLabel={t("common.cancel")}
            createLabel={t("common.add")}
            onCancel={handleCancel}
          />
        }
      >
        <Form
          id={FORM_ID}
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={() => setApiError(null)}
          autoComplete="off"
        >
          <TemplateSourceNameDescriptionFields i18nKeyPrefix={I18N_PREFIX} descriptionRows={3} />

          <Form.Item<ArchiveSourceFormValues>
            label={t(`${I18N_PREFIX}.file`)}
            required
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e: { fileList: UploadFile[] } | undefined) => e?.fileList ?? []}
            rules={[
              {
                required: true,
                type: "array",
                min: 1,
                message: t(`${I18N_PREFIX}.file-required`),
              },
            ]}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{t(`${I18N_PREFIX}.file-drag-title`)}</p>
              <p className="ant-upload-hint">
                {t(`${I18N_PREFIX}.file-drag-hint`, {
                  formats: TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL,
                })}
              </p>
            </Dragger>
          </Form.Item>

          {apiError && <Alert type="error" showIcon message={apiError} />}
        </Form>
      </Modal>
    </>
  );
});
