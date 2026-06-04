import { InboxOutlined } from "@ant-design/icons";
import type { UnpackAs } from "@saltbox/saltbox-core-api-client";
import { Modal, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Form, Input, Segmented, Select, Upload, type UploadFile, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateTemplateSourceModalFooter } from "../../upload/ui/create-template-source-modal-footer";
import { UNPACK_AS_SELECT_OPTIONS } from "../constants/unpack-as-options";
import type { AddSourceFilePayload } from "../types/source-file-payload";

const FORM_ID = "add-source-file-form";
const I18N_PREFIX = "configuration-templates.add-file-modal";
const { Dragger } = Upload;

type SourceFileMode = "file" | "url";

type AddSourceFileFormValues = {
  rel_path: string;
  mode: SourceFileMode;
  file?: UploadFile[];
  url?: string;
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

  const mode = Form.useWatch("mode", form) ?? "file";

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue("mode", "file");
    }
  }, [open, form]);

  useEffect(() => {
    if (mode === "file") {
      form.setFieldValue("url", undefined);
    } else {
      form.setFieldValue("file", undefined);
    }
  }, [form, mode]);

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
    try {
      const relPath = values.rel_path.trim();
      const fileObj = values.mode === "file" ? values.file?.[0]?.originFileObj : undefined;
      const url = values.mode === "url" ? values.url?.trim() : undefined;

      await onAddFile(sourceId, {
        rel_path: relPath,
        file: fileObj ?? null,
        url: url ?? null,
        unpack_as: values.unpack_as ?? null,
      });

      messageApi.success(t(`${I18N_PREFIX}.success`));
      onClose();
    } catch (reason) {
      if (isGlobalServerError(reason)) return;
      console.error("Failed to add source file:", reason);
      messageApi.error(t(`${I18N_PREFIX}.error`));
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
          initialValues={{ mode: "file" as SourceFileMode }}
        >
          <Form.Item<AddSourceFileFormValues>
            name="rel_path"
            label={t(`${I18N_PREFIX}.rel-path`)}
            required
            rules={[{ required: true, message: t(`${I18N_PREFIX}.rel-path-required`) }]}
            extra={t(`${I18N_PREFIX}.rel-path-hint`)}
          >
            <Input placeholder={t(`${I18N_PREFIX}.rel-path-placeholder`)} />
          </Form.Item>

          <Form.Item name="mode" label={t(`${I18N_PREFIX}.source-mode`)}>
            <Segmented
              options={[
                { label: t(`${I18N_PREFIX}.mode-file`), value: "file" },
                { label: t(`${I18N_PREFIX}.mode-url`), value: "url" },
              ]}
            />
          </Form.Item>

          {mode === "file" ? (
            <Form.Item<AddSourceFileFormValues>
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
                {
                  validator: async (_, value: UploadFile[] | undefined) => {
                    if (value?.[0]?.originFileObj) return;
                    throw new Error(t(`${I18N_PREFIX}.file-required`));
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
          ) : (
            <Form.Item<AddSourceFileFormValues>
              name="url"
              label={t(`${I18N_PREFIX}.url`)}
              required
              rules={[
                { required: true, message: t(`${I18N_PREFIX}.url-required`) },
                { type: "url", message: t(`${I18N_PREFIX}.url-invalid`) },
              ]}
            >
              <Input placeholder={t(`${I18N_PREFIX}.url-placeholder`)} />
            </Form.Item>
          )}

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
        </Form>
      </Modal>
    </>
  );
}
