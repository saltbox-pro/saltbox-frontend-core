import type { MinionExtraDataCategoryField } from "@saltbox/saltbox-core-api-client";
import { JsonEditorField } from "@saltbox/saltbox-frontend-common";
import { Form, Typography } from "antd";
import type { Rule } from "antd/es/form";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getFieldInputType,
  isEmptyFormFieldValue,
  isExtraDataFieldRequired,
  isJsonFieldType,
  isJsonOfFieldType,
} from "../helpers/extra-data-item-form";

import styles from "./extra-data-item-field-input.module.css";
import { ExtraDataItemValueInput } from "./extra-data-item-value-input";

type ExtraDataItemFieldInputProps = {
  field: MinionExtraDataCategoryField;
};

export function ExtraDataItemFieldInput({ field }: ExtraDataItemFieldInputProps) {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  const valuePath = ["values", field.name];
  const selectedType = getFieldInputType(field);
  const isRequired = isExtraDataFieldRequired(field);

  const valueRules = useMemo<Rule[]>(() => {
    if (!selectedType) return [];

    const rules: Rule[] = [];

    if (isRequired) {
      rules.push({
        validator: async (_, value: unknown) => {
          if (isEmptyFormFieldValue(value)) {
            throw new Error(t("minions.extra-data.item-form.field-required"));
          }
        },
      });
    }

    if (isJsonFieldType(selectedType)) {
      rules.push({
        validator: async (_, value: string | undefined) => {
          if (isEmptyFormFieldValue(value)) return;
          if (!isJsonOfFieldType(selectedType, value)) {
            throw new Error(t(`minions.extra-data.item-form.invalid-json.${selectedType}`));
          }
        },
      });
    }

    return rules;
  }, [isRequired, selectedType, t]);

  if (!selectedType) {
    return (
      <Form.Item label={field.name}>
        <Typography.Text type="secondary">
          {t("minions.extra-data.item-form.unsupported-type")}
        </Typography.Text>
      </Form.Item>
    );
  }

  return (
    <Form.Item label={field.name} required={isRequired}>
      {isJsonFieldType(selectedType) ? (
        <div className={styles.value}>
          <Form.Item name={valuePath} noStyle rules={valueRules}>
            <JsonEditorField form={form} fieldName={valuePath} height={160} />
          </Form.Item>
        </div>
      ) : (
        <Form.Item name={valuePath} noStyle rules={valueRules}>
          <ExtraDataItemValueInput type={selectedType} />
        </Form.Item>
      )}
    </Form.Item>
  );
}
