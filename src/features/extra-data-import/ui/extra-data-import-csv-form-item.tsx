import { InboxOutlined } from "@ant-design/icons";
import { Form, Upload, type UploadFile } from "antd";
import type { RcFile } from "antd/es/upload";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getImportFormFile } from "../helpers/get-import-form-file";

const FIELD_NAME = "file";
const I18N_PREFIX = "minions.extra-data.import";
const CSV_ACCEPT = ".csv,text/csv";
const { Dragger } = Upload;

export type ExtraDataImportCsvFormValues = {
  file: UploadFile[];
};

type ExtraDataImportCsvFormItemProps = {
  disabled?: boolean;
};

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv";
}

export function ExtraDataImportCsvFormItem({ disabled = false }: ExtraDataImportCsvFormItemProps) {
  const { t } = useTranslation();
  const form = Form.useFormInstance<ExtraDataImportCsvFormValues>();

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

  const uploadProps = useMemo(
    () => ({
      multiple: false,
      maxCount: 1,
      accept: CSV_ACCEPT,
      beforeUpload: (file: RcFile) => {
        if (!isCsvFile(file)) {
          setFileFieldError(t(`${I18N_PREFIX}.file-invalid`));
          return Upload.LIST_IGNORE;
        }

        setFileFieldError(null);
        return false;
      },
    }),
    [setFileFieldError, t]
  );

  return (
    <Form.Item<ExtraDataImportCsvFormValues>
      label={t(`${I18N_PREFIX}.file`)}
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
            const fileObj = getImportFormFile(fileList);
            if (!fileObj) return;

            if (!isCsvFile(fileObj)) {
              throw new Error(t(`${I18N_PREFIX}.file-invalid`));
            }
          },
        },
      ]}
    >
      <Dragger {...uploadProps} disabled={disabled}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{t(`${I18N_PREFIX}.file-drag-title`)}</p>
        <p className="ant-upload-hint">{t(`${I18N_PREFIX}.file-drag-hint`)}</p>
      </Dragger>
    </Form.Item>
  );
}
