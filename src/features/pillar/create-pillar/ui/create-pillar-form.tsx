import { QuestionCircleOutlined } from "@ant-design/icons";
import type { PillarCreateRequestSchema } from "@saltbox/saltbox-core-api-client";
import { Alert, Button, Checkbox, Flex, Form, Input, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import {
  createJsonValueValidator,
  JsonEditorField,
} from "saltbox-core/shared/components/form/fields/json-editor-field";

import { type CreatePillarFormValues, useCreatePillarForm } from "../hooks/use-create-pillar-form";

interface CreatePillarFormProps {
  refreshPillars: () => void;
  tgtType: PillarCreateRequestSchema["tgt_type"];
  tgtId: string;
  onClose: () => void;
}

export function CreatePillarForm({
  refreshPillars,
  tgtType,
  tgtId,
  onClose,
}: CreatePillarFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<CreatePillarFormValues>();
  const { handleSubmit, isCreating, createError, resetCreateError } = useCreatePillarForm({
    refreshPillars,
    tgtType,
    tgtId,
    onClose,
  });

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={resetCreateError}
      initialValues={{ is_personal: false, is_secret: false }}
      autoComplete="off"
    >
      <Form.Item
        name="name"
        label={t("pillars.create.field-name")}
        rules={[
          { required: true, message: t("pillars.create.field-name-required") },
          {
            max: 255,
            message: t("pillars.create.field-name-max-length", { max: 255 }),
          },
        ]}
      >
        <Input placeholder={t("pillars.create.field-name-placeholder")} />
      </Form.Item>

      <Flex gap="middle">
        <Form.Item name="is_personal" valuePropName="checked">
          <Checkbox>
            {t("pillars.create.field-personal")}{" "}
            <Tooltip title={t("pillars.create.field-personal-tooltip")} placement="bottom">
              <Button
                icon={<QuestionCircleOutlined style={{ color: "#8c8c8c" }} />}
                type="text"
                size="small"
              />
            </Tooltip>
          </Checkbox>
        </Form.Item>

        <Form.Item name="is_secret" valuePropName="checked">
          <Checkbox>
            {t("pillars.create.field-secret")}{" "}
            <Tooltip title={t("pillars.create.field-secret-tooltip")} placement="bottom">
              <Button
                icon={<QuestionCircleOutlined style={{ color: "#8c8c8c" }} />}
                type="text"
                size="small"
              />
            </Tooltip>
          </Checkbox>
        </Form.Item>
      </Flex>

      <Form.Item
        name="value"
        label={t("pillars.create.field-value")}
        rules={[
          { required: true, message: t("json-editor-field.value-required") },
          { validator: createJsonValueValidator(t) },
        ]}
      >
        <JsonEditorField form={form} />
      </Form.Item>

      <Flex vertical gap="middle">
        {!!createError && <Alert message={t(createError)} type="error" showIcon />}

        <Flex justify="end" gap="small">
          <Button onClick={onClose}>{t("pillars.create.cancel")}</Button>

          <Button type="primary" htmlType="submit" loading={isCreating} disabled={!!createError}>
            {t("pillars.create.submit")}
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
}
