import { Form, Input } from "antd";
import { useTranslation } from "react-i18next";

import { getTemplateFileNameRules } from "../helpers/template-file-name-rules";

interface TemplateFileNameFieldProps {
  onSubmit: () => void;
}

export function TemplateFileNameField({ onSubmit }: TemplateFileNameFieldProps) {
  const { t } = useTranslation();

  return (
    <Form.Item
      name="fileName"
      label={t("task-template-editor.file-name-label")}
      rules={getTemplateFileNameRules(t)}
      validateFirst
    >
      <Input
        autoFocus
        placeholder={t("task-template-editor.file-name-placeholder")}
        onPressEnter={onSubmit}
      />
    </Form.Item>
  );
}
