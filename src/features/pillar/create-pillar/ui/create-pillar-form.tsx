import { QuestionCircleOutlined } from "@ant-design/icons";
import type { PillarCreateRequestSchema } from "@saltbox/saltbox-core-api-client";
import {
  createJsonValueValidator,
  JsonEditorField,
  MutationErrorAlert,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Checkbox, Flex, Form, Input, Tooltip } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { type CreatePillarFormValues, useCreatePillarForm } from "../hooks/use-create-pillar-form";

interface CreatePillarFormProps {
  refreshPillars: () => void;
  tgtType: PillarCreateRequestSchema["tgt_type"];
  tgtId?: string;
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

  const {
    handleSubmit,
    isCreating,
    createError,
    mutationError,
    setMutationError,
    resetCreateError,
  } = useCreatePillarForm({
    refreshPillars,
    tgtType,
    tgtId,
    onClose,
  });

  const initialValues = useMemo(() => ({ is_secret: false }), []);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={resetCreateError}
      initialValues={initialValues}
      autoComplete="off"
    >
      <Form.Item
        name="name"
        label={t("pillars.create.field-name")}
        rules={[
          { required: true, whitespace: true, message: t("pillars.create.field-name-required") },
          {
            max: 255,
            message: t("pillars.create.field-name-max-length", { max: 255 }),
          },
        ]}
      >
        <Input placeholder={t("pillars.create.field-name-placeholder")} />
      </Form.Item>

      <Flex gap="middle">
        <Form.Item name="is_secret" valuePropName="checked">
          <Checkbox>
            {t("pillars.create.field-secret")}{" "}
            <Tooltip title={t("pillars.create.field-secret-tooltip")}>
              <QuestionCircleOutlined style={{ color: "#8c8c8c", cursor: "help" }} />
            </Tooltip>
          </Checkbox>
        </Form.Item>
      </Flex>

      <Form.Item
        name="value"
        label={t("pillars.create.field-value")}
        rules={[
          { required: true, whitespace: true, message: t("pillars.create.field-value-required") },
          { validator: createJsonValueValidator(t) },
        ]}
      >
        <JsonEditorField form={form} />
      </Form.Item>

      <Flex vertical gap="middle">
        <MutationErrorAlert
          error={mutationError}
          fallback={t("pillars.create.error")}
          onClose={() => setMutationError(null)}
        />

        {!!createError && <Alert message={createError} type="error" showIcon />}

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
