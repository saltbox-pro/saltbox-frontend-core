import { InboxOutlined } from "@ant-design/icons";
import { Form, Upload, type UploadFile } from "antd";
import type { RcFile } from "antd/es/upload";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  TEMPLATE_SOURCE_ARCHIVE_ACCEPT,
  TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL,
  TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_GB,
} from "../constants/template-source-form";
import {
  formatArchiveSourceFileValidationError,
  validateArchiveSourceFile,
} from "../helpers/validate-archive-source-file";

import styles from "./archive-file-form-item.module.css";

const FIELD_NAME = "file";
const I18N_PREFIX = "configuration-templates.archive-source-modal";
const { Dragger } = Upload;

export type ArchiveFileFormValues = {
  file: UploadFile[];
};

export function getArchiveFormFile(fileList: UploadFile[] | undefined): File | undefined {
  return fileList?.[0]?.originFileObj;
}

type ArchiveFileFormItemProps = {
  label: string;
  disabled?: boolean;
};

export function ArchiveFileFormItem({ label, disabled = false }: ArchiveFileFormItemProps) {
  const { t } = useTranslation();
  const form = Form.useFormInstance<ArchiveFileFormValues>();

  const setFileFieldError = useCallback(
    (errorMessage: string | null) => {
      form.setFields([
        {
          name: FIELD_NAME,
          errors: errorMessage ? [errorMessage] : [],
        },
      ]);
    },
    [form]
  );

  const validateFileOnUpload = useCallback(
    (file: RcFile): boolean => {
      const validationError = validateArchiveSourceFile(file);

      if (validationError) {
        setFileFieldError(formatArchiveSourceFileValidationError(validationError, t));
        return false;
      }

      setFileFieldError(null);
      return true;
    },
    [setFileFieldError, t]
  );

  const uploadProps = useMemo(
    () => ({
      multiple: false,
      maxCount: 1,
      accept: TEMPLATE_SOURCE_ARCHIVE_ACCEPT,
      beforeUpload: (file: RcFile) => {
        if (!validateFileOnUpload(file)) {
          return Upload.LIST_IGNORE;
        }

        return false;
      },
    }),
    [validateFileOnUpload]
  );

  return (
    <Form.Item<ArchiveFileFormValues>
      className={styles.fileField}
      label={label}
      required
      name={FIELD_NAME}
      validateFirst
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
          validator: async (_, fileList: UploadFile[]) => {
            const fileObj = getArchiveFormFile(fileList);
            if (!fileObj) return;

            const validationError = validateArchiveSourceFile(fileObj);
            if (!validationError) return;

            throw new Error(formatArchiveSourceFileValidationError(validationError, t));
          },
        },
      ]}
    >
      <Dragger {...uploadProps} disabled={disabled}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{t(`${I18N_PREFIX}.file-drag-title`)}</p>
        <p className="ant-upload-hint">
          {t(`${I18N_PREFIX}.file-drag-hint`, {
            formats: TEMPLATE_SOURCE_ARCHIVE_FORMATS_LABEL,
            maxSizeGb: TEMPLATE_SOURCE_ARCHIVE_MAX_SIZE_GB,
          })}
        </p>
      </Dragger>
    </Form.Item>
  );
}
