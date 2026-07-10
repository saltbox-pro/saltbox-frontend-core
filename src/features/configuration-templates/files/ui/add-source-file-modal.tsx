import { InboxOutlined } from "@ant-design/icons";
import type { UnpackAs } from "@saltbox/saltbox-core-api-client";
import { Modal, getApiErrorMessage, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Alert, Form, Select, Upload, type UploadFile, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateTemplateSourceModalFooter } from "../../upload/ui/create-template-source-modal-footer";
import { UNPACK_AS_SELECT_OPTIONS } from "../constants/unpack-as-options";
import type { AddSourceFilePayload } from "../types/source-file-payload";

const FORM_ID = "add-source-file-form";
const I18N_PREFIX = "configuration-templates.add-file-modal";
const { Dragger } = Upload;

type AddSourceFileFormValues = {
  file?: UploadFile[];
  unpack_as?: UnpackAs;
};

type AddSourceFileModalProps = {
  open: boolean;
  sourceId: string;
  sourceName: string;
  onAddFile: (sourceId: string, payload: AddSourceFilePayload) => Promise<void>;
  onClose: () => void;
};

export function AddSourceFileModal({
  open,
  sourceId,
  sourceName,
  onAddFile,
  onClose,
}: AddSourceFileModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<AddSourceFileFormValues>();
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
    }),
    []
  );

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleFinish = async (values: AddSourceFileFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await onAddFile(sourceId, {
        file: values.file![0].originFileObj!,
        unpack_as: values.unpack_as ?? null,
      });

      messageApi.success(t(`${I18N_PREFIX}.success`));
      onClose();
    } catch (reason) {
      if (isGlobalServerError(reason)) return;
      console.error("Failed to add source file:", reason);
      setApiError(await getApiErrorMessage(reason, t(`${I18N_PREFIX}.error`)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={t(`${I18N_PREFIX}.title`, { name: sourceName })}
        open={open}
        onCancel={handleCancel}
        footer={
          <CreateTemplateSourceModalFooter
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            cancelLabel={t(`${I18N_PREFIX}.cancel`)}
            createLabel={t(`${I18N_PREFIX}.add`)}
            onCancel={handleCancel}
          />
        }
        destroyOnHidden
        maskClosable={!isSubmitting}
      >
        <Form
          id={FORM_ID}
          form={form}
          layout="vertical"
          disabled={isSubmitting}
          onFinish={handleFinish}
          onValuesChange={() => setApiError(null)}
        >
          <Form.Item<AddSourceFileFormValues>
            label={t(`${I18N_PREFIX}.file`)}
            required
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e: { fileList: UploadFile[] } | undefined) => e?.fileList ?? []}
            rules={[
              {
                validator: async (_, fileList: UploadFile[] | undefined) => {
                  if (!fileList?.[0]?.originFileObj) {
                    throw new Error(t(`${I18N_PREFIX}.file-required`));
                  }
                },
              },
            ]}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{t(`${I18N_PREFIX}.file-drag-title`)}</p>
              <p className="ant-upload-hint">{t(`${I18N_PREFIX}.file-drag-hint`)}</p>
            </Dragger>
          </Form.Item>

          <Form.Item
            name="unpack_as"
            label={t(`${I18N_PREFIX}.unpack-as`)}
            extra={t(`${I18N_PREFIX}.unpack-as-hint`)}
          >
            <Select
              allowClear
              placeholder={t(`${I18N_PREFIX}.unpack-as-none`)}
              options={UNPACK_AS_SELECT_OPTIONS}
            />
          </Form.Item>

          {apiError && <Alert type="error" showIcon message={apiError} />}
        </Form>
      </Modal>
    </>
  );
}
