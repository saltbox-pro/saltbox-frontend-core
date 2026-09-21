import { EditOutlined } from "@ant-design/icons";
import type { PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  createJsonValueValidator,
  JsonEditorField,
  MutationErrorAlert,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Form } from "antd";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatPillarValueToString } from "../helpers/format-pillar-value";
import { useEditPillarForm } from "../hooks/use-edit-pillar-form";

import styles from "./pillar-edit-form.module.css";

export interface PillarValueFormProps {
  pillar: PillarWithTgtInfoSchema | null;
  onReplacePillar?: (updated: PillarWithTgtInfoSchema) => void;
  deleteBlock?: ReactNode;
}

export function PillarEditForm({ pillar, onReplacePillar, deleteBlock }: PillarValueFormProps) {
  const { t } = useTranslation();

  const [form] = Form.useForm<{ value: string }>();

  const [isEditing, setIsEditing] = useState(false);

  const isSecret = pillar?.is_secret;
  const valueString = useMemo(() => formatPillarValueToString(pillar?.value), [pillar?.value]);

  const { handleSave, isSaving, saveError, mutationError, setMutationError, resetSaveState } =
    useEditPillarForm({
      form,
      pillar,
      onReplacePillar,
      isSecret,
      onSuccess: () => setIsEditing(false),
    });

  useEffect(() => {
    if (!pillar || isSecret) {
      setIsEditing(false);
      resetSaveState();
      return;
    }

    form.setFieldsValue({ value: valueString });
    setIsEditing(false);
    resetSaveState();
  }, [pillar, isSecret, valueString, form, resetSaveState]);

  const handleCancelEdit = () => {
    if (!pillar || isSecret) return;

    form.setFieldsValue({ value: valueString });
    setIsEditing(false);
    resetSaveState();
  };

  if (!pillar || isSecret) return null;

  return (
    <Flex vertical flex={1}>
      <Flex justify="end" gap="small">
        <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)} disabled={isEditing}>
          {t("common.edit")}
        </Button>
        {deleteBlock}
      </Flex>

      <Form
        key={pillar.id}
        form={form}
        initialValues={{ value: valueString }}
        layout="vertical"
        rootClassName={styles.form}
        requiredMark={false}
      >
        {isEditing && (
          <>
            <MutationErrorAlert
              error={mutationError}
              fallback={t("pillars.edit.error")}
              onClose={() => setMutationError(null)}
            />

            {!!saveError && (
              <Alert message={saveError} type="error" showIcon style={{ marginBottom: 16 }} />
            )}
          </>
        )}

        <Form.Item
          className={styles.valueFormItem}
          name="value"
          label={
            <Flex align="center" gap="small">
              {t("pillar.details.value")}
              <CopyToClipboardButton text={valueString} />
            </Flex>
          }
          rules={[
            { required: true, whitespace: true, message: t("pillars.create.field-value-required") },
            { validator: createJsonValueValidator(t) },
          ]}
        >
          <JsonEditorField form={form} disabled={!isEditing} height={345} />
        </Form.Item>

        {isEditing && (
          <Flex justify="end" gap="small">
            <Button onClick={handleCancelEdit}>{t("common.cancel")}</Button>
            <Button type="primary" loading={isSaving} onClick={handleSave}>
              {t("common.save")}
            </Button>
          </Flex>
        )}
      </Form>
    </Flex>
  );
}
