import { QuestionCircleOutlined } from "@ant-design/icons";
import type { PillarCreateSchema, PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Alert, Button, Checkbox, Flex, Form, Input, Tooltip, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { type PillarsStore, apiCoreStore } from "saltbox-core/store";

import { createPillarValueValidator } from "../utils/pillar-value-validator";
import { isParseValueError, parseAndValidatePillarValue } from "../utils/validation";

import { JsonEditorField } from "./create-pillar-form-value-field";

export type { PillarValueType } from "../utils/validation";

interface CreatePillarFormValues {
  name: string;
  value: string;
  is_personal: boolean;
  is_secret: boolean;
}

interface CreatePillarFormProps {
  store: PillarsStore;
  tgtType: PillarTgtType;
  tgtId: string;
  onClose: () => void;
}

export function CreatePillarForm({ store, tgtType, tgtId, onClose }: CreatePillarFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<CreatePillarFormValues>();

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSubmit = async (values: CreatePillarFormValues) => {
    setIsCreating(true);
    setCreateError(null);

    const api = apiCoreStore.pillarsApi;

    if (!api) {
      setCreateError("pillars.create.error");
      setIsCreating(false);
      return;
    }

    const parsed = parseAndValidatePillarValue(values.value);

    if (isParseValueError(parsed)) {
      setCreateError(parsed.errorKey);
      setIsCreating(false);
      return;
    }

    if (values.is_secret && typeof parsed.value === "object" && parsed.value !== null) {
      setCreateError("pillars.create.field-secret-primitive-only");
      setIsCreating(false);
      return;
    }

    const body: PillarCreateSchema = {
      name: values.name,
      value: parsed.value,
      is_personal: values.is_personal,
      is_secret: values.is_secret,
      tgt_type: tgtType,
      tgt_id: tgtType === "root" ? null : tgtId,
    };

    try {
      await api.pillarCreate({ PillarCreateSchema: body });

      message.success(t("pillars.create.success"));
      store.loadPillars();
      onClose();
    } catch (_) {
      setCreateError("pillars.create.error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={() => setCreateError(null)}
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

      <Form.Item
        name="value"
        label={t("pillars.create.field-value")}
        rules={[
          { required: true, message: t("pillars.create.field-value-required") },
          { validator: createPillarValueValidator(t) },
        ]}
      >
        <JsonEditorField form={form} />
      </Form.Item>

      <Flex gap="middle">
        <Form.Item name="is_personal" valuePropName="checked">
          <Checkbox>{t("pillars.create.field-personal")}</Checkbox>
        </Form.Item>

        <Form.Item name="is_secret" valuePropName="checked">
          <Checkbox>
            {t("pillars.create.field-secret")}{" "}
            <Tooltip title={t("pillars.create.field-secret-primitive-only")}>
              <Button
                icon={<QuestionCircleOutlined style={{ color: "#8c8c8c" }} />}
                type="text"
                size="small"
              />
            </Tooltip>
          </Checkbox>
        </Form.Item>
      </Flex>

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
